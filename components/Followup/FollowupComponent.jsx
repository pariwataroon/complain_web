import React, { useState, useEffect, useRef, useMemo } from "react";
import { Container, Box } from "@mui/material";
import NavbarMain from "@services/navbarMain/navbarMain";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs.jsx";
import TableAll from "@services/table/TableAll";
import { GetMeAllComplaints, GetComplaintOutgoingTracking } from "@pages/api/complaint/complaint";

const STATUS_MAP = {
  "รับเรื่อง": "submitted",
  "ส่งหน่วยงานที่เกี่ยวข้อง": "sent_to_external",
  "กำลังดำเนินการ": "in_process",
  "ติดตามผล": "tracking",
  "มอบหมายเจ้าหน้าที่": "assigned",
  "แจ้งผลการพิจารณา": "reviewed",
  "อยู่ระหว่างพิจารณา": "in_review",
  // รองรับทั้ง “ปิดเรื่อง” และ “ปิดเรื่องแล้ว”
  "ปิดเรื่อง": ["completed", "cancelled"],
  "ปิดเรื่องแล้ว": ["completed", "cancelled"],
};

const RESOLVED = ["completed", "cancelled", "closed", "resolved", "done"];
const CLOSED_WORDS = ["ยุติเรื่อง", "ยุติเรื่องได้", "ปิดเรื่อง", "ปิดงาน"];

// แปลง code → label ไทย
const toThaiLabel = (code = "") => {
  const s = String(code).toLowerCase();
  switch (s) {
    case "submitted": return "รับเรื่อง";
    case "sent_to_external":
    case "sent_to_agency":
    case "forwarded": return "ส่งหน่วยงานที่เกี่ยวข้อง";
    case "in_process":
    case "in_progress": return "กำลังดำเนินการ";
    case "tracking": return "ติดตามผล";
    case "assigned": return "มอบหมายเจ้าหน้าที่";
    case "reviewed": return "แจ้งผลการพิจารณา";
    case "in_review": return "อยู่ระหว่างพิจารณา";
    case "completed":
    case "cancelled":
    case "closed":
    case "resolved":
    case "done": return "ปิดเรื่องแล้ว";
    default: return code || "-";
  }
};

// ใช้ตอนเช็คจาก outgoing (สำหรับสถานะอื่น ๆ เท่านั้น)
const closedByOutgoing = (history = []) =>
  history.some(
    (h) =>
      (h?.type === "outgoing_report" || h?.status === "outgoing_report") &&
      (h?.ext?.is_closed_by_consideration === true ||
        CLOSED_WORDS.includes(h?.ext?.consideration_result))
  );

// concurrency limiter ง่าย ๆ
async function mapWithConcurrency(items, limit, iteratee) {
  const out = Array(items.length);
  let idx = 0;
  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (true) {
      const i = idx++;
      if (i >= items.length) break;
      out[i] = await iteratee(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

export default function FollowupComponent() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [allComplaints, setAllComplaints] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // รู้ว่าเป็นโหมด “ปิดเรื่อง” ไหม (รองรับทั้ง ปิดเรื่อง/ปิดเรื่องแล้ว)
  const isClosedFilter = useMemo(() => {
    if (!statusFilter) return false;
    if (statusFilter === "ปิดเรื่อง" || statusFilter === "ปิดเรื่องแล้ว") return true;
    const code = STATUS_MAP[statusFilter] ?? statusFilter;
    const arr = Array.isArray(code) ? code : [code];
    return arr.includes("completed") || arr.includes("cancelled");
  }, [statusFilter]);

  // debounce ค่าค้นหา
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 450);
    return () => clearTimeout(t);
  }, [search]);

  // cache ปิดเรื่องจาก outgoing (TTL 10 นาที) — ใช้เฉพาะ non-closed views
  const closedCacheRef = useRef(new Map()); // id -> { value: boolean, ts: number }
  const TTL = 10 * 60 * 1000;
  const getCached = (id) => {
    const e = closedCacheRef.current.get(id);
    if (!e) return undefined;
    if (Date.now() - e.ts > TTL) {
      closedCacheRef.current.delete(id);
      return undefined;
    }
    return e.value;
  };
  const setCached = (id, value) => {
    closedCacheRef.current.set(id, { value, ts: Date.now() });
  };

  const breadcrumbItems = useMemo(() => ([
    {
      label: "เมนูติดตามผลการดำเนินการ",
      icon: (
        <img
          src="/icons/docticon.png"
          alt="icon"
          style={{ width: 24, height: 24, marginBottom: -8 }}
        />
      ),
    },
  ]), []);

  // ===== โหลดรายการหลัก (พร้อม pre-check หน้าแรก สำหรับ non-closed views) =====
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // แปลงตัวกรองเป็น codes (เช่น ["completed","cancelled"])
        const code = statusFilter ? (STATUS_MAP[statusFilter] ?? statusFilter) : "";
        const codes = Array.isArray(code) ? code : (code ? [code] : []);
        let items = [];

        // ดึงข้อมูลทั้งหมดแล้วให้ TableAll กรองเอง เพื่อป้องกัน logic ชนกัน
        const res = await GetMeAllComplaints({
          skip: 0,
          limit: 1000000,
          search: debouncedSearch,
        });
        items = res?.res_data?.items || [];

        if (cancelled) return;

        // ตกแต่งรอบแรก (ยังไม่เช็ค outgoing)
        const baseDecorated = items.map((it) => {
          const raw = String(it.status || "").toLowerCase();
          const cached = getCached(it.id);
          const computed = cached ? "completed" : raw;

          return {
            ...it,
            _raw_status: it.status,
            _raw_status_label: it.status_label,
            _closedByOutgoing: cached === true,
            status: computed,
            status_label: cached ? "ปิดเรื่องแล้ว" : (it.status_label || toThaiLabel(raw)),
            status_for_filter: computed,
          };
        });

        // === PRE-CHECK หน้าแรก ให้ได้ "ปิดเรื่องแล้ว" ตั้งแต่แรก ===
        let finalDecorated = baseDecorated;
        const firstPage = baseDecorated.slice(0, rowsPerPage);
        const idsToCheck = firstPage
          .filter((it) => !RESOLVED.includes(String(it._raw_status || it.status || "").toLowerCase()))
          .filter((it) => getCached(it.id) === undefined)
          .map((it) => it.id);

        if (idsToCheck.length > 0) {
          await mapWithConcurrency(idsToCheck, 2, async (id) => {
            try {
              const res = await GetComplaintOutgoingTracking(id);
              const history =
                res?.data?.res_data?.history ??
                res?.res_data?.history ??
                res?.history ?? [];
              const isClosed = closedByOutgoing(history);
              setCached(id, isClosed);
            } catch {
              setCached(id, false);
            }
          });

          finalDecorated = baseDecorated.map((it, idx) => {
            if (idx >= rowsPerPage) return it;
            const cached = getCached(it.id);
            if (cached === undefined) return it;
            const computed = cached ? "completed" : String(it._raw_status || it.status || "").toLowerCase();
            return {
              ...it,
              _closedByOutgoing: cached,
              status: computed,
              status_label: cached ? "ปิดเรื่องแล้ว" : (it._raw_status_label || toThaiLabel(computed)),
              status_for_filter: computed,
            };
          });
        }

        setAllComplaints(finalDecorated);
        setTotalCount(finalDecorated.length);
        setPage(0);
      } catch (e) {
        console.error("Load complaints failed", e);
        setAllComplaints([]);
        setTotalCount(0);
      }
    })();

    return () => { cancelled = true; };
  }, [debouncedSearch, statusFilter, rowsPerPage]);

  // ===== เช็ค outgoing-tracking เฉพาะแถวที่มองเห็น =====
  const start = page * rowsPerPage;
  const end = start + rowsPerPage;
  const visibleRows = allComplaints.slice(start, end);

  useEffect(() => {
    let cancelled = false;
    const toCheck = visibleRows
      .filter((it) => !RESOLVED.includes(String(it._raw_status || it.status || "").toLowerCase()))
      .filter((it) => getCached(it.id) === undefined)
      .map((it) => it.id);

    if (toCheck.length === 0) return;

    (async () => {
      try {
        await mapWithConcurrency(toCheck, 2, async (id) => {
          try {
            const res = await GetComplaintOutgoingTracking(id);
            const history =
              res?.data?.res_data?.history ??
              res?.res_data?.history ??
              res?.history ?? [];
            const isClosed = closedByOutgoing(history);
            setCached(id, isClosed);
          } catch {
            setCached(id, false);
          }
        });

        if (cancelled) return;

        setAllComplaints((prev) =>
          prev.map((it, idx) => {
            if (idx < start || idx >= end) return it;
            const cached = getCached(it.id);
            if (cached === undefined) return it;
            const computed = cached ? "completed" : String(it._raw_status || it.status || "").toLowerCase();
            return {
              ...it,
              _closedByOutgoing: cached,
              status: computed,
              status_label: cached ? "ปิดเรื่องแล้ว" : (it._raw_status_label || toThaiLabel(computed)),
              status_for_filter: String(it._raw_status || it.status || "").toLowerCase(), // ใช้ raw status
            };
          })
        );
      } catch {
        // no-op
      }
    })();

    return () => { cancelled = true; };
  }, [visibleRows, page, rowsPerPage, start, end]);

  const handleRowsPerPageChange = (n) => {
    setRowsPerPage(n);
    setPage(0);
  };
  const handlePageChange = (p) => setPage(p);

  return (
    <>
      <NavbarMain />
      <Box sx={{ minHeight: "100vh", py: 4 }}>
        <Container maxWidth="lg">
          <BreadcrumbsService items={breadcrumbItems} />
        </Container>

        <TableAll
          title="ติดตามผลการดำเนินการ"
          data={allComplaints}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          navigateTo="/followup"
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Box>
    </>
  );
}
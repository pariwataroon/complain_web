"""
SQL Server safe IN query utility.

SQL Server มี parameter limit 2100 ต่อ query เดียว
เมื่อใช้ .in_() กับ list ยาวๆ จะ error:
  (pyodbc.Error) ('07002', 'COUNT field incorrect or syntax error')

วิธีใช้:
  1) ใช้ safe_query_in() แทน .in_() ตรงๆ:
       from lib.safe_in_query import safe_query_in
       rows = safe_query_in(db, Model.column, large_id_list)

  2) หรือเรียก patch_in_method() ตอน app startup เพื่อให้ .in_()
     auto-chunk อัตโนมัติทั้ง project ไม่ต้องเปลี่ยนโค้ดเก่า:
       from lib.safe_in_query import patch_in_method
       patch_in_method()  # เรียกครั้งเดียวตอน startup
"""
from typing import List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_


# SQL Server parameter limit = 2100
# ใช้ 900 ปลอดภัย (รองรับ query ที่มี IN clause 2 ตัวใน query เดียว)
DEFAULT_CHUNK_SIZE = 900


def safe_query_in(
    db: Session,
    column,
    values: List[Any],
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    extra_filter=None,
    order_by=None,
) -> list:
    """
    Query โดยใช้ IN clause แบบ auto-chunk เพื่อไม่เกิน SQL Server parameter limit

    Args:
        db: SQLAlchemy Session
        column: SQLAlchemy column เช่น Complaint.id, Complaint.parent_complaint_id
        values: list ของค่าที่ต้องการ query
        chunk_size: ขนาด chunk (default 900)
        extra_filter: SQLAlchemy filter เพิ่มเติม เช่น Complaint.status == 'active'
        order_by: SQLAlchemy order_by clause

    Returns:
        list ของ results รวมทุก chunk
    """
    if not values:
        return []

    all_rows = []
    seen = set()
    for i in range(0, len(values), chunk_size):
        chunk = values[i:i + chunk_size]
        query = db.query(column.class_).filter(column.in_(chunk))
        if extra_filter is not None:
            query = query.filter(extra_filter)
        if order_by is not None:
            query = query.order_by(order_by)
        rows = query.all()
        for row in rows:
            pk = _get_primary_key(row)
            if pk not in seen:
                seen.add(pk)
                all_rows.append(row)
    return all_rows


def safe_query_multi_in(
    db: Session,
    in_clauses: list,
    exclude_clauses: Optional[list] = None,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    order_by=None,
) -> list:
    """
    Query ที่รองรับหลาย IN clauses + exclude clauses (NOT IN)
    Auto-chunk ทุก clause พร้อมกัน

    Args:
        db: SQLAlchemy Session
        in_clauses: list ของ (column, values) tuples เช่น [(Complaint.parent_complaint_id, master_ids)]
        exclude_clauses: list ของ (column, values) tuples สำหรับ NOT IN
        chunk_size: ขนาด chunk (default 900)
        order_by: SQLAlchemy order_by clause

    Returns:
        list ของ results รวมทุก chunk
    """
    # ลด chunk_size ตามจำนวน clauses เพื่อไม่เกิน 2100 total params
    total_clauses = len(in_clauses) + (len(exclude_clauses) if exclude_clauses else 0)
    if total_clauses > 1:
        chunk_size = max(100, DEFAULT_CHUNK_SIZE // total_clauses)

    all_rows = []
    seen = set()

    # หาค่า max length ของทุก clause list เพื่อทำ nested chunk
    max_len = max((len(v) for _, v in in_clauses), default=0)
    if exclude_clauses:
        max_len = max(max_len, max((len(v) for _, v in exclude_clauses), default=0))

    # สร้าง chunk ranges สำหรับแต่ละ clause
    def chunk_indices(values, size):
        return list(range(0, len(values), size))

    # ใช้ itertools.product เพื่อ generate ทุก combination ของ chunks
    all_ranges = []
    for col, vals in in_clauses:
        all_ranges.append(chunk_indices(vals, chunk_size))

    if exclude_clauses:
        for col, vals in exclude_clauses:
            all_ranges.append(chunk_indices(vals, chunk_size))

    if not all_ranges:
        return []

    # Generate all combinations
    import itertools
    all_combinations = list(itertools.product(*all_ranges))

    for combo in all_combinations:
        filters = []
        idx = 0
        for col, vals in in_clauses:
            ci = combo[idx]
            filters.append(col.in_(vals[ci:ci + chunk_size]))
            idx += 1
        if exclude_clauses:
            for col, vals in exclude_clauses:
                ci = combo[idx]
                filters.append(~col.in_(vals[ci:ci + chunk_size]))
                idx += 1

        query = db.query(in_clauses[0][0].class_).filter(and_(*filters))
        if order_by is not None:
            query = query.order_by(order_by)
        rows = query.all()
        for row in rows:
            pk = _get_primary_key(row)
            if pk not in seen:
                seen.add(pk)
                all_rows.append(row)

    return all_rows


def _get_primary_key(row) -> Any:
    """Extract primary key value from a SQLAlchemy row"""
    mapper = row.__class__.__mapper__
    pk_columns = mapper.primary_key
    if len(pk_columns) == 1:
        return getattr(row, pk_columns[0].key)
    return tuple(getattr(row, col.key) for col in pk_columns)


def patch_in_method():
    """
    Monkey-patch SQLAlchemy InstrumentedAttribute.in_()
    ให้ auto-chunk เมื่อ list ยาวเกิน chunk_size

    ⚠️ ใช้ด้วยความระมัดระวัง — เรียกตอน app startup ครั้งเดียว
    หลังจากเรียกแล้ว ทุก .in_() ทั้ง project จะ auto-chunk

    ข้อจำกัด: patch นี้ใช้กับ case ที่เรียก .in_()
    โดยตรงบน column เท่านั้น เช่น Model.id.in_(values)
    """
    from sqlalchemy.sql import coercions
    from sqlalchemy.orm.attributes import InstrumentedAttribute

    original_in = InstrumentedAttribute.in_

    def patched_in(self, *values):
        # Flatten ถ้ามีหลาย arguments
        flat = []
        for v in values:
            if isinstance(v, (list, tuple, set)):
                flat.extend(v)
            else:
                flat.append(v)

        # ถ้าไม่เกิน limit ใช้วิธีเดิม
        if len(flat) <= DEFAULT_CHUNK_SIZE:
            return original_in(self, *values)

        # เกิน limit → ใช้ or_ + chunks
        chunks = []
        for i in range(0, len(flat), DEFAULT_CHUNK_SIZE):
            chunk = flat[i:i + DEFAULT_CHUNK_SIZE]
            chunks.append(original_in(self, *chunk))
        return or_(*chunks)

    InstrumentedAttribute.in_ = patched_in

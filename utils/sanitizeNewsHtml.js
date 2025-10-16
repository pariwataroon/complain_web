/**
 * @param {string} dirty
 * @param {{ imgBase?: string }} opts
 * @returns {string}
 */
export function sanitizeForStorage(dirty, opts = {}) {
  if (!dirty) return "";
  if (typeof window === "undefined") return dirty;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(dirty, "text/html");

    if (!doc || !doc.body) {
      console.error("Failed to parse HTML");
      return dirty;
    }

    const allowed = new Set([
      "p", "br", "strong", "b", "em", "i", "u",
      "ul", "ol", "li", "h3", "h4", "blockquote",
      "a", "img", "table", "thead", "tbody", "tr", "th", "td",
      "div", "span", "font"
    ]);

    const walk = (node) => {
      // ลบคอมเมนต์
      if (node.nodeType === Node.COMMENT_NODE) {
        if (node.parentNode) node.parentNode.removeChild(node);
        return;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node;
        const tag = el.tagName.toLowerCase();

        // ข้ามแท็ก html, body, head เพราะเป็นโครงสร้างของ document
        if (tag === "html" || tag === "body" || tag === "head") {
          let child = node.firstChild;
          while (child) {
            const next = child.nextSibling;
            walk(child);
            child = next;
          }
          return;
        }

        // map b/i -> strong/em
        if (tag === "b") {
          const strong = doc.createElement("strong");
          strong.innerHTML = el.innerHTML;
          el.replaceWith(strong);
          walk(strong);
          return;
        }
        if (tag === "i") {
          const em = doc.createElement("em");
          em.innerHTML = el.innerHTML;
          el.replaceWith(em);
          walk(em);
          return;
        }

        // ไม่อยู่ใน whitelist -> ยก inner ขึ้นแทน
        if (!allowed.has(tag)) {
          const parent = el.parentNode;
          while (el.firstChild) parent && parent.insertBefore(el.firstChild, el);
          parent && parent.removeChild(el);
          return;
        }

        // ลบแอททริบิวต์ทั้งหมด ยกเว้นที่จำเป็น
        Array.from(el.attributes).forEach((attr) => {
          const name = attr.name.toLowerCase();
          const val = attr.value;

          const keepA = tag === "a" && name === "href" && !/^javascript:/i.test(val);
          const keepImg = tag === "img" && (name === "src" || name === "alt" || name === "title");
          const keepTable = (tag === "td" || tag === "th") && (name === "colspan" || name === "rowspan" || name === "scope");
          const keepStyle = (tag === "font" || tag === "span" || tag === "div" || tag === "p") && name === "style";

          if (!(keepA || keepImg || keepTable || keepStyle)) el.removeAttribute(name);
        });

        // จัดการ <a>
        if (tag === "a" && el.getAttribute("href")) {
          el.setAttribute("target", "_blank");
          el.setAttribute("rel", "noopener noreferrer nofollow");
        }

        // จัดการ <img>
        if (tag === "img") {
          const src = el.getAttribute("src") || "";
          if (/^javascript:/i.test(src)) {
            el.remove();
          } else {
            // ต่อ base ถ้าระบุและ src ไม่ใช่ absolute/data:
            if (opts.imgBase && src && !/^https?:\/\//i.test(src) && !/^data:image\//i.test(src)) {
              el.setAttribute("src", `${opts.imgBase}${src.startsWith("/") ? "" : "/"}${src}`);
            }
            el.removeAttribute("width");
            el.removeAttribute("height");
            el.removeAttribute("style");
          }
        }

        // ลบ class/data-* ออกหมด เพื่อคุมด้วย CSS กลาง
        // เก็บ style ไว้สำหรับ font, span, div, p
        if (tag !== "font" && tag !== "span" && tag !== "div" && tag !== "p") {
          el.removeAttribute("style");
        }
        el.removeAttribute("class");
        Array.from(el.attributes).forEach((a) => {
          if (a.name && a.name.startsWith("data-")) el.removeAttribute(a.name);
        });
      }

      if (node.nodeType === Node.TEXT_NODE) {
        // เก็บ &nbsp; ไว้เพื่อรักษาการเว้นวรรค
        // ไม่ต้อง replace \u00a0 เป็น space ปกติ
      }

      // เดินต่อ
      let child = node.firstChild;
      while (child) {
        const next = child.nextSibling;
        walk(child);
        child = next;
      }
    };

    walk(doc.body);

    // ลด br มากเกินไป (มากกว่า 3 ตัวติดกัน)
    // แต่ยังคงไว้ถึง 2 br เพื่อให้มีการเว้นบรรทัด
    let brCount = 0;
    let prevBr = null;
    doc.body.querySelectorAll("br").forEach((br) => {
      if (prevBr && br.previousSibling === prevBr) {
        brCount++;
        if (brCount >= 2) {
          br.remove(); // ลบ br ที่ 3 เป็นต้นไป
        }
      } else {
        brCount = 0;
      }
      prevBr = br;
    });

    // เก็บ <p> ว่างไว้เพื่อรักษาการเว้นย่อหน้า
    // ไม่ลบ <p> ที่ว่าง

    // ลดหัวข้อใหญ่ให้มาตรฐาน (h1/h2 -> h3/h4)
    doc.body.querySelectorAll("h1").forEach((h) => {
      const n = doc.createElement("h3");
      n.innerHTML = h.innerHTML;
      h.replaceWith(n);
    });
    doc.body.querySelectorAll("h2").forEach((h) => {
      const n = doc.createElement("h4");
      n.innerHTML = h.innerHTML;
      h.replaceWith(n);
    });

    return (doc.body.innerHTML || "").trim();
  } catch (error) {
    console.error("Error sanitizing HTML:", error);
    return dirty;
  }
}

// ใช้ชื่อเดียวกันตอนแสดงผล
export const sanitizeForDisplay = sanitizeForStorage;

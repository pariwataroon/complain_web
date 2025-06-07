import React from "react";
import { useRouter } from "next/router";

const FollowStatus = () => {
  const router = useRouter();
  const { id } = router.query; // รับ id จาก slug

  return (
    <div>
      <h1>FollowStatus</h1>
      <p>ID: {id}</p>
      {id ? (
        <div>
          <p>กำลังแสดงข้อมูลสำหรับ ID: {id}</p>
          {/* ใส่ logic แสดงข้อมูลตาม id ที่นี่ */}
        </div>
      ) : (
        <p>กำลังโหลด...</p>
      )}
    </div>
  );
};

export default FollowStatus;

"use client";
import React from "react";
import Image from "next/image";
import Navbar from "./components/Navbar/Navbar";

const Home = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <Image
        src="/bg1.png"
        alt="Background"
        width={1920}
        height={400}
        priority
        quality={100}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          objectFit: "cover",
          minWidth: "100%",
          minHeight: "100%",
          zIndex: -1,
        }}
      />
      <Navbar />
      {/* Rest of your page content can go here */}
    </div>
  );
};

export default Home;

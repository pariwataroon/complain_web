import Navbar from "@services/navbar/navbar";
import Footer from "@services/footer/footer";
import Homepage1 from "@services/homepage1/homepage1";
import Homepage2 from "@services/homepage2/homepage2";
import Homepage3 from "@services/homepage3/homepage3";
import Homepage4 from "@services/homepage4/homepage4";
import Homepage5 from "@services/homepage5/homepage5";
import Homepage6 from "@services/homepage6/homepage6";
import Chat from "@services/Chat/Chat";

export default function HomeComponent() {
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 100 }}
      >
        <Navbar menuType="alt" />
      </div>

      <Homepage1 />
      <Homepage2 />
      <div id="steps-section">
        <Homepage3 />
      </div>
      <Homepage4 />
      <Homepage5 />
      <div id="steps-ask">
        <Homepage6 />
      </div>
      <Chat />
      <Footer />
    </div>
  );
}

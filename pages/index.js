import HomeComponent from "@components/HomeComponent";
import Navbar from "services/navbar/navbar";
export default function HomePage() {
  return (
    <div>
      <Navbar />
      <HomeComponent />
    </div>
  );
}

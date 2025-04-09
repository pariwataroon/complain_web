import Sidebar from "@services/Sidebar/Sidebar";
import styles from "./AppLayout.module.scss";

const AdminLayout = ({ children, backgroundColor = "#f8fbff" }) => {
  return (
    <div className={styles.adminLayout}>
      <Sidebar />
      <main
        className={styles.content}
        style={{ "--content-bg-color": backgroundColor }}
      >
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;

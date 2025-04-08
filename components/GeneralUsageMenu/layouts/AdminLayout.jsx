import Sidebar from "@services/Sidebar/Sidebar";
import styles from "./AppLayout.module.scss";

const AdminLayout = ({ children }) => {
  return (
    <div className={styles.adminLayout}>
      <Sidebar />
      <main className={styles.content}>{children}</main>
    </div>
  );
};

export default AdminLayout;

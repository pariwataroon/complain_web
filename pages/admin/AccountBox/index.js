import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import AccountBoxComponents from "@components/AccountBox/AccountBoxComponents";
const AccountBox = () => {
  return (
    <div>
      <AccountBoxComponents />
    </div>
  );
};

AccountBox.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default AccountBox;

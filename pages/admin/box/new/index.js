import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import AnonymousLetterRepository from "@components/Box/AnonymousLetterRepository/AnonymousLetterRepository";

const New = () => {
  return (
    <div>
      <AnonymousLetterRepository />
    </div>
  );
};

New.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default New;

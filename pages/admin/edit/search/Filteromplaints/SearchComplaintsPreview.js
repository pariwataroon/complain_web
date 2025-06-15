import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import SearchComplaintsPreview from "@components/ReceiveData/Filteromplaints/SearchComplaintsPreview";

const SearchComplaintsPreviewPage = () => {
  return (
    <div>
      <SearchComplaintsPreview />
    </div>
  );
};

SearchComplaintsPreviewPage.getLayout = (page) => (
  <AdminLayout>{page}</AdminLayout>
);

export default SearchComplaintsPreviewPage;

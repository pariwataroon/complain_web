import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import ForwardtoagencyComponents from "@components/ReceiveData/ForwardtoagencyComponents/ForwardtoagencyComponents";

const ForwardtoagencyIndex = () => {
    return (
        <div>
            <ForwardtoagencyComponents />
        </div>
    );
};

ForwardtoagencyIndex.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default ForwardtoagencyIndex;

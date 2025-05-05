import AdminLayout from "@components/GeneralUsageMenu/layouts/AdminLayout";
import StackedLineChartComponents from "@components/StackedLineChart/StackedLineChartComponents";
const StackedLineChart = () => {
  return (
    <div>
      <StackedLineChartComponents />
    </div>
  );
};

StackedLineChart.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default StackedLineChart;

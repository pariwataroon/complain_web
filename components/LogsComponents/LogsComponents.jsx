import React, { useState, useEffect, useCallback } from 'react'; 
import BreadcrumbsService from '@services/BreadCrumbs/breadcrumbs';
import TableLogs from '@services/TableLogs/TableLogs';
import { GetAllLogs } from '@pages/api/logs/logs';
import HistoryIcon from '@mui/icons-material/History';

const breadcrumbItems = [
    {
        label: (
            "บันทึกการใช้งานของระบบ"
        ),
        icon: (
            <HistoryIcon />
        ),
    },
];

const LogsComponents = () => {
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        skip: 0,
        limit: 10,
        page: 0,
    });
    const [filters, setFilters] = useState({});

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const response = await GetAllLogs({
                skip: pagination.skip,
                limit: pagination.limit,
                filters,
            });

            if (response.res_code === "0000") {
                setLogs(response.res_data || []);
                setTotal(response.total || response.res_data?.length || 0);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            setLogs([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [pagination, filters]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleSearch = useCallback((searchFilters) => {
        setFilters(searchFilters);
        setPagination(prev => ({ ...prev, skip: 0, page: 0 }));
    }, []);

    const handlePaginationChange = useCallback((newPagination) => {
        setPagination(prev => ({
            ...prev,
            ...newPagination,
            skip: newPagination.page * newPagination.limit,
        }));
    }, []);
    return (
        <>
            <BreadcrumbsService items={breadcrumbItems} />
            <TableLogs
                data={logs}
                total={total}
                title="ประวัติการใช้งาน API"
                navigateTo="/admin/logs"
                onSearch={handleSearch}
                onPaginationChange={handlePaginationChange}
                loading={loading}
            />
        </>
    )
}

export default LogsComponents
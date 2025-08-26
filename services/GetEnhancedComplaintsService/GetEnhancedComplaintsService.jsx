import React, { useState, useEffect } from 'react';
import { GetEnhancedComplaints } from "@pages/api/complaint/complaint";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import styles from "./GetEnhancedComplaintsService.module.scss";

function GetEnhancedComplaintsService({ onComplaintSelect }) {
    const [openDialog, setOpenDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [complaintsData, setComplaintsData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const response = await GetEnhancedComplaints({ skip: 0, limit: 100 });
            if (response?.res_code === "0000" && response?.res_data?.items) {
                setComplaintsData(response.res_data.items);
            }
        } catch (error) {
            console.error('Error fetching complaints:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (openDialog && complaintsData.length === 0) {
            fetchComplaints();
        }
    }, [openDialog]);

    // กรองข้อมูลตามการค้นหา
    const filteredComplaints = complaintsData.filter(complaint =>
        complaint?.complaint_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint?.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint?.complaint_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint?.complainant_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectComplaint = (complaint) => {
        setSelectedComplaint(complaint);
        setOpenDialog(false);
        setSearchQuery('');

        // ส่งข้อมูลที่เลือกไปยัง parent component
        if (onComplaintSelect) {
            onComplaintSelect(complaint);
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSearchQuery('');
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className={styles.complaintSearchContainer}>
            {/* Main Search Icon Button */}
            <div className={styles.searchButtonWrapper}>
                <button
                    className={styles.searchIconButton}
                    onClick={() => setOpenDialog(true)}
                    onMouseDown={(e) => e.preventDefault()}
                    aria-label="ค้นหาเรื่องร้องเรียน"
                    title="ค้นหาเรื่องร้องเรียน"
                >
                    <SearchIcon />
                </button>
            </div>

            {/* Search Dialog Modal */}
            {openDialog && (
                <div className={styles.modalOverlay} onClick={handleCloseDialog}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>ค้นหาเรื่องร้องเรียน</h2>
                            <button
                                className={styles.closeButton}
                                onClick={handleCloseDialog}
                                aria-label="ปิด"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* Search Input */}
                            <div className={styles.searchInputContainer}>
                                <SearchIcon className={styles.searchIcon} />
                                <input
                                    type="text"
                                    className={styles.searchInput}
                                    placeholder="ค้นหาด้วยเลขที่เรื่อง, หัวข้อ, ประเภท, หรือชื่อผู้ร้องเรียน"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Results List */}
                            <div className={styles.complaintsList}>
                                {loading ? (
                                    <div className={styles.loadingSpinner}>
                                        <div>กำลังโหลดข้อมูล...</div>
                                    </div>
                                ) : filteredComplaints.length > 0 ? (
                                    filteredComplaints.map((complaint) => (
                                        <button
                                            key={complaint.id}
                                            className={styles.complaintItem}
                                            onClick={() => handleSelectComplaint(complaint)}
                                        >
                                            <div className={styles.complaintHeader}>
                                                <div>
                                                    <div className={styles.complaintNumber}>
                                                        {complaint.complaint_number}
                                                    </div>
                                                    <div className={styles.complaintSubject}>
                                                        {complaint.subject}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={styles.complaintDetails}>
                                                <span
                                                    className={`${styles.statusBadge} ${styles[complaint.status?.replace(/\s+/g, '')]}`}
                                                >
                                                    {complaint.status}
                                                </span>
                                                <span className={styles.complaintType}>
                                                    {complaint.complaint_type}
                                                </span>
                                            </div>

                                            <div className={styles.complaintMeta}>
                                                <span className={styles.complainantName}>
                                                    ผู้ร้องเรียน: {complaint.complainant_name}
                                                </span>
                                                <span className={styles.complaintDate}>
                                                    {formatDate(complaint.created_at)}
                                                </span>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className={styles.noResults}>
                                        {searchQuery ? 'ไม่พบเรื่องร้องเรียนที่ตรงกับการค้นหา' : 'ไม่มีข้อมูลเรื่องร้องเรียน'}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button className={styles.cancelButton} onClick={handleCloseDialog}>
                                ปิด
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GetEnhancedComplaintsService;
import { useRef } from "react";
import {
    Box,
    Paper,
    Typography,
    Grid,
    CircularProgress,
} from "@mui/material";
import ButtonService from "@services/ButtonService/ButtonService";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import ImageIcon from "@mui/icons-material/Image";
import DownloadIcon from "@mui/icons-material/Download";
import Image from "next/image";
import {
    formatThaiDate,
    formatThaiDateTime,
    formatPhoneNumber_null,
    formatCitizenId_null,
} from "@utils/Formats";
import { exportElementToPDF } from "@utils/exportPDF";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CheckIcon from "@mui/icons-material/Check";
import UploadOutlinedIcon from "@mui/icons-material/UploadOutlined";

const ComplaintIDService = ({ complaint }) => {
    if (!complaint)
        return (
            <Box display="flex" justifyContent="center" my={5}>
                <CircularProgress />
            </Box>
        );

    const step1 = complaint.step1?.general ?? {};
    const step2 = complaint.step2?.general ?? {};
    const step3 = complaint.step3?.general ?? {};

    const complainant = step1.general ?? {};
    const delegate = step1.delegate ?? {};
    const corporateCaller = step2.corporate ?? {};

    const complaintInfo = step3 ?? {};
    const files = complaintInfo.attachment ?? [];

    const label = (obj) => (typeof obj === "object" ? obj?.label || "-" : obj || "-");

    const pdfRef = useRef();

    const InfoItem = ({ labelText, value }) => (
        <Grid item xs={12} sm={6}>
            <Typography fontSize={16}>
                <Box component="span" fontWeight="bold">
                    {labelText}:
                </Box>{" "}
                {value}
            </Typography>
        </Grid>
    );

    const getFileIcon = (ext) => {
        switch (ext.toLowerCase()) {
            case ".pdf":
                return <PictureAsPdfIcon sx={{ color: "#d32f2f", mr: 1 }} />;
            case ".doc":
            case ".docx":
                return <DescriptionIcon sx={{ color: "#1976d2", mr: 1 }} />;
            case ".jpg":
            case ".jpeg":
            case ".png":
                return <ImageIcon sx={{ color: "#388e3c", mr: 1 }} />;
            default:
                return <DescriptionIcon sx={{ color: "#757575", mr: 1 }} />;
        }
    };

    const getFileExt = (filename) =>
        filename.slice(filename.lastIndexOf(".")).toLowerCase();

    // ฟังก์ชันสำหรับดาวน์โหลดไฟล์
    const handleDownloadFile = (fileUrl, fileName) => {
        if (!fileUrl) return;

        // สร้าง URL แบบเต็มถ้าเป็น relative path
        const downloadUrl = fileUrl.startsWith('http') ? fileUrl : `${window.location.origin}${fileUrl}`;

        // สร้าง element a สำหรับดาวน์โหลด
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName || 'download';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Box>
            <div ref={pdfRef}>
                <Box
                    sx={{
                        height: 40,
                        background: "linear-gradient(to right, #EDC458, #FEFAEF)",
                        borderTopRightRadius: 8,
                        borderTopLeftRadius: 8,
                    }}
                />
                <Paper sx={{ mt: -1, p: 4, borderRadius: 2 }}>
                    {/* Header & Logo */}
                    <Box display="flex" alignItems="center" mb={3}>
                        <Image
                            src="/logo_blue.png"
                            alt="โลโก้"
                            width={100}
                            height={100}
                            style={{ objectFit: "contain" }}
                        />
                        <Typography variant="h6" fontWeight="bold" ml={2}>
                            แบบรับคำร้องเรียน / ร้องทุกข์กระทรวงการคลัง
                        </Typography>
                    </Box>

                    {/* ข้อมูลคำร้อง */}
                    <Grid container spacing={2} mb={3}>
                        <InfoItem
                            labelText="วันที่ร้องทุกข์"
                            value={formatThaiDate(complaint.created_at)}
                        />
                        <InfoItem
                            labelText="เลขที่คำร้อง"
                            value={complaint.complaint_number}
                        />
                        <InfoItem
                            labelText="ประเภทเรื่องร้องทุกข์"
                            value={complaintInfo.complaintType || "-"}
                        />
                        <InfoItem labelText="เรื่อง" value={complaintInfo.subject || "-"} />
                        <InfoItem
                            labelText="วันเวลาที่เกิดเหตุ"
                            value={
                                complaintInfo.incidentDate
                                    ? formatThaiDateTime(complaintInfo.incidentDate)
                                    : "-"
                            }
                        />
                    </Grid>
                    <Divider />

                    {/* ผู้ร้องทุกข์ */}
                    <Section title="ข้อมูลผู้ร้องทุกข์">
                        <Grid container spacing={2} mb={3}>
                            <InfoItem
                                labelText="หมายเลขประจำตัวประชาชน"
                                value={formatCitizenId_null(
                                    complainant.idCard || corporateCaller.idCard
                                )}
                            />
                            <InfoItem
                                labelText="ชื่อ - นามสกุล / บริษัท"
                                value={
                                    complainant.name ||
                                    corporateCaller.companyName ||
                                    "-"
                                }
                            />
                            <InfoItem
                                labelText="ที่อยู่"
                                value={complainant.address || corporateCaller.address || "-"}
                            />
                            <InfoItem
                                labelText="จังหวัด"
                                value={
                                    label(complainant.province) || label(corporateCaller.province)
                                }
                            />
                            <InfoItem
                                labelText="อำเภอ/เขต"
                                value={
                                    label(complainant.districts) ||
                                    label(corporateCaller.districts)
                                }
                            />
                            <InfoItem
                                labelText="ตำบล/แขวง"
                                value={
                                    label(complainant.subdistricts) ||
                                    label(corporateCaller.subdistricts)
                                }
                            />
                            <InfoItem
                                labelText="รหัสไปรษณีย์"
                                value={
                                    complainant.zipcode?.label ||
                                    corporateCaller.zipcode?.label ||
                                    "-"
                                }
                            />
                            <InfoItem
                                labelText="อีเมล์"
                                value={complainant.email || corporateCaller.email || "-"}
                            />
                            <InfoItem
                                labelText="โทรศัพท์"
                                value={formatPhoneNumber_null(
                                    complainant.phone || corporateCaller.phone
                                )}
                            />
                        </Grid>
                    </Section>

                    {/* ผู้รับมอบอำนาจ (ถ้ามี) */}
                    {Object.keys(delegate).length > 0 && (
                        <>
                            <Section title="ผู้รับมอบอำนาจร้องเรียน">
                                <Grid container spacing={2} mb={3}>
                                    <InfoItem
                                        labelText="หมายเลขประจำตัวประชาชน"
                                        value={formatCitizenId_null(delegate.idCard)}
                                    />
                                    <InfoItem labelText="ชื่อ - นามสกุล" value={delegate.name} />
                                    <InfoItem labelText="ที่อยู่" value={delegate.address} />
                                    <InfoItem
                                        labelText="จังหวัด"
                                        value={label(delegate.province)}
                                    />
                                    <InfoItem
                                        labelText="อำเภอ/เขต"
                                        value={label(delegate.districts)}
                                    />
                                    <InfoItem
                                        labelText="ตำบล/แขวง"
                                        value={label(delegate.subdistricts)}
                                    />
                                    <InfoItem
                                        labelText="รหัสไปรษณีย์"
                                        value={delegate.zipcode?.label || "-"}
                                    />
                                    <InfoItem labelText="อีเมล์" value={delegate.email} />
                                    <InfoItem
                                        labelText="โทรศัพท์"
                                        value={formatPhoneNumber_null(delegate.phone)}
                                    />
                                </Grid>
                            </Section>
                        </>
                    )}

                    {/* รายละเอียดเรื่องร้องทุกข์ */}
                    <Section title="รายละเอียดเรื่องร้องทุกข์">
                        <Grid container spacing={2} mb={3}>
                            <Grid item xs={12}>
                                <Typography>{complaintInfo.description || "-"}</Typography>
                            </Grid>
                        </Grid>
                    </Section>

                    {/* เอกสารแนบ */}
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        เอกสารประกอบการร้องทุกข์
                    </Typography>
                    <Box mb={3}>
                        {files.length > 0 ? (
                            files.map((file, idx) => {
                                const ext = getFileExt(file.fileName || file.name || "");
                                const fileName = file.fileName || file.name || `ไฟล์แนบ ${idx + 1}`;

                                return (
                                    <Box
                                        key={idx}
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            border: "1px solid #ccc",
                                            borderRadius: "8px",
                                            px: 2,
                                            py: 1,
                                            mb: 1,
                                            cursor: file.fileUrl ? "pointer" : "default",
                                            "&:hover": file.fileUrl ? {
                                                backgroundColor: "#f5f5f5",
                                                borderColor: "#999"
                                            } : {}
                                        }}
                                        onClick={() => file.fileUrl && handleDownloadFile(file.fileUrl, fileName)}
                                    >
                                        <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
                                            {getFileIcon(ext)}
                                            <Typography fontSize={14} color="text.secondary">
                                                {fileName}
                                            </Typography>
                                        </Box>

                                        {file.fileUrl && (
                                            <Box sx={{ display: "flex", alignItems: "center", ml: 2 }}>
                                                <DownloadIcon
                                                    sx={{
                                                        color: "#1976d2",
                                                        fontSize: 20,
                                                        "&:hover": {
                                                            color: "#1565c0"
                                                        }
                                                    }}
                                                />
                                            </Box>
                                        )}
                                    </Box>
                                );
                            })
                        ) : (
                            <Typography fontSize={14} color="text.secondary">
                                ไม่มีไฟล์แนบ
                            </Typography>
                        )}
                    </Box>

                    {/* รับรอง */}
                    <Typography fontSize={16} mb={1}>
                        ข้าพเจ้าขอรับรองว่าข้อเท็จจริงที่ได้ยื่นเรื่องร้องเรียน/ร้องทุกข์ข้างต้นเป็นความจริงทุกประการ
                    </Typography>
                    <Typography fontSize={16} mb={3}>
                        หมายเหตุ : เอกสารฉบับนี้ไม่สามารถนำไปใช้อ้างอิงเอกสารอื่น
                    </Typography>

                    <Divider />

                    {/* ลายเซ็น */}
                    <Grid container spacing={2} mb={3}>
                        <InfoItem
                            labelText="ลงชื่อผู้ร้องทุกข์"
                            value={complainant.name || "-"}
                        />
                        <InfoItem
                            labelText="ลงชื่อผู้รับมอบอำนาจ"
                            value={delegate.name || "-"}
                        />
                        <InfoItem labelText="วันที่" value={formatThaiDate()} />
                        <InfoItem labelText="วันที่" value={formatThaiDate()} />
                    </Grid>
                </Paper>
            </div>

            {/* ปุ่ม Action */}
            <Box
                sx={{ display: "flex", justifyContent: "center", mt: 4, gap: 2 }}
            >
                {/* <ButtonService
                    label="แก้ไข"
                    color="แก้ไข"
                    variant="outlined"
                    iconLeft={<EditOutlinedIcon />}
                />
                <ButtonService
                    label="ยืนยัน"
                    color="ยืนยัน"
                    variant="contained"
                    iconRight={<CheckIcon />}
                /> */}
                <ButtonService
                    label="ส่งออก"
                    color="ส่งออก"
                    variant="outlined"
                    onClick={() => exportElementToPDF(pdfRef, "แบบฟอร์มร้องทุกข์.pdf")}
                    iconRight={<UploadOutlinedIcon />}
                />
            </Box>
        </Box>
    );
};

const Section = ({ title, children }) => (
    <>
        <Typography variant="subtitle1" fontWeight="bold" fontSize={20} gutterBottom>
            {title}
        </Typography>
        {children}
        <Divider />
    </>
);

const Divider = () => (
    <Box
        component="hr"
        sx={{ border: "1px solid", height: "1px", backgroundColor: "#999", my: 3 }}
    />
);

export default ComplaintIDService;
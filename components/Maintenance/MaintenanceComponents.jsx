import Head from 'next/head';
import styles from './Maintenance.module.scss';

export default function Maintenance() {
    return (
        <>
            <Head>
                <title>ปิดปรับปรุงระบบ - ระบบร้องเรียน</title>
                <meta name="description" content="ระบบปิดปรับปรุงชั่วคราว" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <div className={styles.container}>
                <div className={styles.content}>
                    <div className={styles.icon}>
                        🔧
                    </div>
                    <h1 className={styles.title}>ระบบปิดปรับปรุงชั่วคราว</h1>
                    <p className={styles.description}>
                        ขออภัยในความไม่สะดวก เรากำลังปรับปรุงระบบเพื่อให้บริการที่ดีขึ้น
                    </p>
                    <p className={styles.subDescription}>
                        ระบบจะกลับมาให้บริการโดยเร็วที่สุด
                    </p>
                    <div className={styles.contact}>
                        <p>หากมีเหตุจำเป็นเร่งด่วน กรุณาติดต่อ:</p>
                        <p><strong>โทร:</strong> 1689</p>
                    </div>
                </div>
            </div>
        </>
    );
}
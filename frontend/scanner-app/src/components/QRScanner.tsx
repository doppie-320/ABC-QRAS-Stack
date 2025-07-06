import { useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScanner({ onScan }: { onScan: (text: string) => void }) {
    useEffect(() => {
        const qr = new Html5Qrcode('reader');
        let hasScanned = false;

        qr.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            async (decodedText) => {
                if (hasScanned) return;
                hasScanned = true;

                console.info("QR scanned:", decodedText);

                try {
                    await onScan(decodedText);
                } catch (err) {
                    console.error("Scan handling failed:", err);
                }

                try {
                    const state = qr.getState?.();
                    if (state === 2 || state === 3) {
                        await qr.stop();
                    } else {
                        console.warn("Skip stop(): not running");
                    }
                } catch (e: any) {
                    console.warn("QR stop error:", e.message);
                }
            },
            (err) => {
                // Filter out spammy "No MultiFormat Readers" message
                if (!err.includes("No MultiFormat Readers")) {
                    console.warn("QR scan error:", err);
                }
            }
        );

        return () => {
            const state = qr.getState?.();
            if (state === 2 || state === 3) {
                qr.stop().catch(console.error);
            }
        };
    }, []);

    return <div id="reader" style={{ width: '100%' }} />;
}

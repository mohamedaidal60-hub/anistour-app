
import React, { useRef, useState, useEffect } from 'react';
import { X, Eraser, Check } from 'lucide-react';

interface SignaturePadProps {
    onSave: (signature: string) => void;
    onClose: () => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, []);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
        const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
        const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const save = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        onSave(canvas.toDataURL('image/png'));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] w-full max-w-lg overflow-hidden flex flex-col">
                <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-950">
                    <div>
                        <h3 className="text-lg font-black uppercase text-white tracking-widest">Signature Agent</h3>
                        <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Validez l'opération numériquement</p>
                    </div>
                    <button onClick={onClose} className="text-neutral-500 hover:text-white"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6">
                    <canvas
                        ref={canvasRef}
                        width={500}
                        height={300}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl cursor-crosshair touch-none"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                </div>

                <div className="p-6 border-t border-neutral-800 bg-neutral-950 flex gap-3">
                    <button onClick={clear} className="flex-1 py-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                        <Eraser className="w-4 h-4" /> Effacer
                    </button>
                    <button onClick={save} className="flex-1 py-4 bg-red-700 hover:bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95">
                        <Check className="w-4 h-4" /> Enregistrer & Valider
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SignaturePad;

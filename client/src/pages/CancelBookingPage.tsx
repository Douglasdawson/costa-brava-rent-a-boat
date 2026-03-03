import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CancelInfo {
  booking: {
    id: string;
    customerName: string;
    customerSurname: string;
    startTime: string;
    endTime: string;
    totalAmount: string;
    bookingStatus: string;
    boatName: string;
    language: string;
  };
  refundPolicy: {
    hoursUntilStart: number;
    refundPercentage: number;
    refundAmount: number;
  };
}

export default function CancelBookingPage() {
  const [, params] = useRoute("/cancel/:token");
  const token = params?.token;

  const [info, setInfo] = useState<CancelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [cancelResult, setCancelResult] = useState<{ refundAmount: number; refundPercentage: number } | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Token de cancelación no encontrado.");
      setLoading(false);
      return;
    }
    fetch(`/api/bookings/cancel-info/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || `Error ${res.status}`);
        }
        return res.json();
      })
      .then((data: CancelInfo) => {
        setInfo(data);
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleCancel = async () => {
    if (!token) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/bookings/cancel/${token}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
      setCancelResult({ refundAmount: data.refundAmount, refundPercentage: data.refundPercentage });
      setCancelled(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cancelar");
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("es-ES", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4 bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-2xl mb-2">No se puede cancelar</p>
          <p className="text-gray-600">{error}</p>
          <a href="/" className="mt-4 inline-block text-primary underline">Volver al inicio</a>
        </div>
      </div>
    );
  }

  if (cancelled && cancelResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4 bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-green-600">&#10003;</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reserva cancelada</h1>
          {cancelResult.refundAmount > 0 ? (
            <p className="text-gray-600">
              Se procesará un reembolso de <strong>{cancelResult.refundAmount.toFixed(2)} EUR</strong> ({cancelResult.refundPercentage}%) en los próximos días hábiles.
            </p>
          ) : (
            <p className="text-gray-600">
              La cancelación se ha procesado. Según nuestra política, la cancelación con menos de 24h de antelación no genera reembolso.
            </p>
          )}
          <p className="text-sm text-gray-400 mt-4">Recibirás un email de confirmación.</p>
          <a href="/" className="mt-6 inline-block text-primary underline">Volver al inicio</a>
        </div>
      </div>
    );
  }

  if (!info) return null;

  const { booking, refundPolicy } = info;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4 bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Cancelar reserva</h1>

        {/* Booking details */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm">
          <p><span className="text-gray-500">Barco:</span> <strong>{booking.boatName}</strong></p>
          <p><span className="text-gray-500">Fecha:</span> <strong>{formatDate(booking.startTime)}</strong></p>
          <p><span className="text-gray-500">Cliente:</span> <strong>{booking.customerName} {booking.customerSurname}</strong></p>
          <p><span className="text-gray-500">Total pagado:</span> <strong>{parseFloat(booking.totalAmount).toFixed(2)} EUR</strong></p>
        </div>

        {/* Refund policy */}
        <div className={`rounded-xl p-4 mb-6 text-sm border ${
          refundPolicy.refundPercentage === 100
            ? 'bg-green-50 border-green-200'
            : refundPolicy.refundPercentage === 50
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <p className="font-semibold mb-1">Política de cancelación</p>
          {refundPolicy.refundPercentage === 100 && (
            <p className="text-green-800">Cancelación con más de 48h de antelación: <strong>reembolso completo ({refundPolicy.refundAmount.toFixed(2)} EUR)</strong>.</p>
          )}
          {refundPolicy.refundPercentage === 50 && (
            <p className="text-yellow-800">Cancelación entre 24-48h: <strong>reembolso del 50% ({refundPolicy.refundAmount.toFixed(2)} EUR)</strong>.</p>
          )}
          {refundPolicy.refundPercentage === 0 && (
            <p className="text-red-800">Cancelación con menos de 24h de antelación: <strong>sin reembolso</strong>.</p>
          )}
        </div>

        {/* Confirm button */}
        <div className="space-y-3">
          <Button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            {cancelling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Confirmar cancelación
          </Button>
          <a
            href="/"
            className="block text-center text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Mantener reserva
          </a>
        </div>
      </div>
    </div>
  );
}

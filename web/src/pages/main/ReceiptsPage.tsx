import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { receiptService } from '../../services/api';
import { Receipt, CATEGORIES } from '../../types';
import ReceiptCard from '../../components/ui/ReceiptCard';
import Spinner from '../../components/ui/Spinner';
import { useReceiptPolling } from '../../hooks/useReceiptPolling';
import { Search, X, Receipt as ReceiptIcon, Wifi } from 'lucide-react';

export default function ReceiptsPage() {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadReceipts = useCallback(async (reset = false) => {
    try {
      setError(false);
      const currentPage = reset ? 1 : page;
      const res = await receiptService.getReceipts({
        page: currentPage,
        limit: 20,
        search: search || undefined,
        category: activeCategory || undefined,
      });
      const newReceipts: Receipt[] = res.data || [];
      if (reset) {
        setReceipts(newReceipts);
        setPage(2);
      } else {
        setReceipts((prev) => [...prev, ...newReceipts]);
        setPage((prev) => prev + 1);
      }
      setHasMore(newReceipts.length === 20);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, activeCategory, page]);

  useEffect(() => {
    setLoading(true);
    loadReceipts(true);
  }, [search, activeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  useReceiptPolling(() => loadReceipts(true), true);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 200 && hasMore && !loadingMore) {
      setLoadingMore(true);
      loadReceipts();
    }
  }, [hasMore, loadingMore, loadReceipts]);

  return (
    <div className="h-full flex flex-col">
      {/* Header fijo */}
      <div className="bg-surface border-b border-border px-6 py-4 space-y-3 flex-shrink-0">
        <h1 className="text-2xl font-black text-text-primary">Mis Recibos</h1>

        {/* Buscador */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            className="input-field pl-9 pr-9"
            placeholder="Buscar por comercio, categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
              onClick={() => setSearch('')}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {['Todos', ...CATEGORIES].map((cat) => {
            const isActive = cat === 'Todos' ? !activeCategory : activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat === 'Todos' ? null : cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  isActive
                    ? 'bg-primary text-white border-primary'
                    : 'bg-background text-text-secondary border-border hover:border-primary/30'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2" onScroll={handleScroll}>
        {loading ? (
          <div className="flex justify-center pt-12">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center pt-16 gap-4 text-center">
            <Wifi size={48} className="text-text-muted" />
            <h3 className="text-lg font-bold text-text-primary">Sin conexión</h3>
            <p className="text-text-secondary text-sm">No se pudieron cargar los recibos</p>
            <button onClick={() => loadReceipts(true)} className="btn-primary px-6">
              Reintentar
            </button>
          </div>
        ) : receipts.length === 0 ? (
          <div className="flex flex-col items-center pt-16 gap-4 text-center">
            <ReceiptIcon size={56} className="text-border" />
            <h3 className="text-lg font-bold text-text-primary">
              {search ? 'Sin resultados' : 'Sin recibos'}
            </h3>
            <p className="text-text-secondary text-sm">
              {search ? 'No encontramos resultados para tu búsqueda' : 'Escanea tu primer recibo'}
            </p>
          </div>
        ) : (
          <>
            {receipts.map((r) => (
              <ReceiptCard
                key={r.id}
                receipt={r}
                onClick={() => navigate(`/receipts/${r.id}`)}
              />
            ))}
            {loadingMore && (
              <div className="flex justify-center py-4">
                <Spinner size="sm" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

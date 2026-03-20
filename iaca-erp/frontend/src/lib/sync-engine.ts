import { set, get, update } from 'idb-keyval';

// Tipos
export type SyncRequest = {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'DELETE';
  body: unknown;
  createdAt: number;
};

export type OfflineResponse = { ok: boolean; offline: true };

const STORE_KEY = 'offline-sync-queue';

export const SyncEngine = {
  /**
   * Adiciona uma requisição à fila offline
   */
  async enqueue(url: string, method: 'POST' | 'PUT' | 'DELETE', body: unknown) {
    const request: SyncRequest = {
      id: crypto.randomUUID(),
      url,
      method,
      body,
      createdAt: Date.now()
    };

    await update(STORE_KEY, (val) => {
      const queue = (val as SyncRequest[]) || [];
      return [...queue, request];
    });

    console.log(`[SyncEngine] Requisição enfileirada: ${url}`);
    // toast.info("Sem internet. Salvo para envio posterior."); 
  },

  /**
   * Tenta processar a fila de sincronização
   */
  async processQueue() {
    if (!navigator.onLine) return;

    const queue = (await get(STORE_KEY)) as SyncRequest[] | undefined;
    if (!queue || queue.length === 0) return;

    console.log(`[SyncEngine] Processando ${queue.length} itens pendentes...`);

    const failedRequests: SyncRequest[] = [];

    for (const req of queue) {
      try {
        const response = await fetch(req.url, {
          method: req.method,
          headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${token}` // TODO: Gerenciar Token
          },
          body: JSON.stringify(req.body)
        });

        if (!response.ok) {
           // Se for erro de servidor (500), mantemos na fila?
           // Se for 400 (Bad Request), descartamos pois nunca vai passar.
           if (response.status >= 500) throw new Error('Server Error');
           console.error(`[SyncEngine] Erro ${response.status} descartando requisição.`);
        } else {
            console.log(`[SyncEngine] Item ${req.id} sincronizado com sucesso.`);
        }
      } catch (error) {
        console.error(`[SyncEngine] Falha ao sincronizar ${req.id}, mantendo na fila.`, error);
        failedRequests.push(req);
      }
    }

    // Atualiza a fila apenas com os que falharam (por erro de rede/server)
    await set(STORE_KEY, failedRequests);
    
    if (failedRequests.length === 0) {
        console.log("[SyncEngine] Fila esvaziada!");
        // toast.success("Dados sincronizados com sucesso!");
    }
  },

  /**
   * Wrapper para fetch que decide se vai pra fila ou pra rede
   */
  async fetchOrQueue(url: string, method: 'POST' | 'PUT' | 'DELETE', body: unknown): Promise<Response | OfflineResponse> {
    if (navigator.onLine) {
      try {
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        
        // Se falhar por rede (ex: 'Failed to fetch'), cai no catch
        return response; 
      } catch (error) {
        console.warn("[SyncEngine] Falha de rede detectada, enfileirando...", error);
        await this.enqueue(url, method, body);
        return { ok: true, offline: true }; // Fake success
      }
    } else {
      await this.enqueue(url, method, body);
      return { ok: true, offline: true }; // Fake success
    }
  }
};

// Auto-start sync listener
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        console.log("[SyncEngine] Conexão restabelecida. Sincronizando...");
        SyncEngine.processQueue();
    });
}

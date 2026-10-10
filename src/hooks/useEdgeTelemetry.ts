import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { edgeSimulator } from '@/lib/edge/simulator';
import type { EdgeNode, LiveTelemetry } from '@/types';

export function useEdgeTelemetry() {
  const [nodes, setNodes] = useState<EdgeNode[]>([]);
  const [telemetry, setTelemetry] = useState<LiveTelemetry[]>([]);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  const fetchNodes = useCallback(async () => {
    const { data, error } = await supabase
      .from('nodes')
      .select('*')
      .order('name');

    if (error) {
      console.error('Failed to load nodes:', error.message);
      return;
    }

    if (data) {
      setNodes(data as EdgeNode[]);
      edgeSimulator.initialize(data as EdgeNode[]);
      if (!initialized.current) {
        edgeSimulator.subscribe((readings) => setTelemetry(readings));
        edgeSimulator.start(2000);
        initialized.current = true;
      }
    }
  }, []);

  useEffect(() => {
    fetchNodes().finally(() => setLoading(false));
  }, [fetchNodes]);

  return { nodes, telemetry, loading, refetch: fetchNodes };
}

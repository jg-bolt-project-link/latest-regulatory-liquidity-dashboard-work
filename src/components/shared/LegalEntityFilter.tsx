import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Building2, ChevronDown } from 'lucide-react';

interface LegalEntity {
  id: string;
  entity_code: string;
  entity_name: string;
  entity_type: string;
  jurisdiction: string;
  is_material_entity: boolean;
}

interface LegalEntityFilterProps {
  selectedEntityId: string | null;
  onEntityChange: (entityId: string | null) => void;
  showMaterialOnly?: boolean;
}

export function LegalEntityFilter({ selectedEntityId, onEntityChange, showMaterialOnly = false }: LegalEntityFilterProps) {
  const { user } = useAuth();
  const [entities, setEntities] = useState<LegalEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadEntities();
  }, [showMaterialOnly]);

  const loadEntities = async () => {
    let query = supabase
      .from('legal_entities')
      .select('*')
      .is('user_id', null)
      .order('entity_code');

    if (showMaterialOnly) {
      query = query.eq('is_material_entity', true);
    }

    const { data, error } = await query;

    if (data) {
      setEntities(data);
    }
    setLoading(false);
  };

  const selectedEntity = entities.find(e => e.id === selectedEntityId);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Legal Entity View
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:border-slate-400 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-600" />
          <span className="text-sm text-slate-900">
            {selectedEntity ? (
              <>
                <span className="font-semibold">{selectedEntity.entity_code}</span>
                {selectedEntity.is_material_entity && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Material Entity</span>
                )}
              </>
            ) : (
              'Consolidated (All Entities)'
            )}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
            <button
              onClick={() => {
                onEntityChange(null);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 ${
                !selectedEntityId ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-600" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Consolidated View</p>
                  <p className="text-xs text-slate-500">All legal entities aggregated</p>
                </div>
              </div>
            </button>

            {loading ? (
              <div className="px-4 py-3 text-sm text-slate-500">Loading entities...</div>
            ) : entities.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-500">No legal entities found</div>
            ) : (
              entities.map((entity) => (
                <button
                  key={entity.id}
                  onClick={() => {
                    onEntityChange(entity.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                    selectedEntityId === entity.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{entity.entity_code}</p>
                        {entity.is_material_entity && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            Material Entity
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{entity.entity_name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {entity.jurisdiction} · {entity.entity_type}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

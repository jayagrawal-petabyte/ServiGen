import React, { useState, useMemo } from 'react';
import type { ConfigurationItem, CiType, CiRelationship } from '../../types/cmdb';
import type { CiTopologyGraph, CiTopologyNode, CiTopologyEdge } from '../../services/cmdbService';
import {
  Server,
  Database,
  Network,
  Shield,
  Cloud,
  HardDrive,
  GitBranch,
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Layers,
  Search,
  Filter,
} from 'lucide-react';

interface CiVisualTopologyTreeProps {
  rootCi: ConfigurationItem;
  topologyGraph?: CiTopologyGraph | null;
  allCis?: ConfigurationItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onSelectCi?: (ciId: string) => void;
  onLinkRelationship?: (targetId: string, type: string, direction: 'upstream' | 'downstream') => Promise<void>;
  onUnlinkRelationship?: (targetId: string) => Promise<void>;
  compact?: boolean;
}

export const CiVisualTopologyTree: React.FC<CiVisualTopologyTreeProps> = ({
  rootCi,
  topologyGraph,
  allCis = [],
  isLoading = false,
  onRefresh,
  onSelectCi,
  onLinkRelationship,
  onUnlinkRelationship,
  compact = false,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedDirectionFilter, setSelectedDirectionFilter] = useState<'all' | 'upstream' | 'downstream'>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [showAddLinkModal, setShowAddLinkModal] = useState<boolean>(false);
  const [newTargetId, setNewTargetId] = useState<string>('');
  const [newRelType, setNewRelType] = useState<string>('depends_on');
  const [newRelDirection, setNewRelDirection] = useState<'upstream' | 'downstream'>('downstream');
  const [isSubmittingLink, setIsSubmittingLink] = useState<boolean>(false);

  // Compute Warranty Status badge
  const getWarrantyInfo = (dateStr?: string) => {
    if (!dateStr) return null;
    const expiry = new Date(dateStr);
    if (isNaN(expiry.getTime())) return null;
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `Expired (${expiry.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })})`,
        variant: 'expired',
        className: 'bg-rose-900/60 text-rose-300 border-rose-700/60',
      };
    }
    if (diffDays <= 90) {
      return {
        label: `Expiring: ${diffDays}d left`,
        variant: 'warning',
        className: 'bg-amber-900/60 text-amber-300 border-amber-700/60',
      };
    }
    return {
      label: `Warranty: ${expiry.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`,
      variant: 'valid',
      className: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/60',
    };
  };

  const getCiIcon = (type: string) => {
    switch (type) {
      case 'Database':
        return <Database className="w-4 h-4 text-indigo-400" />;
      case 'Network':
        return <Network className="w-4 h-4 text-emerald-400" />;
      case 'Cloud Service':
        return <Cloud className="w-4 h-4 text-sky-400" />;
      case 'Security':
        return <Shield className="w-4 h-4 text-rose-400" />;
      case 'Application':
        return <Layers className="w-4 h-4 text-violet-400" />;
      default:
        return <Server className="w-4 h-4 text-amber-400" />;
    }
  };

  // Group nodes into topological tiers: Upstream -> Root CI -> Downstream
  const { upstreamNodes, downstreamNodes, allNodes, filteredEdges } = useMemo(() => {
    const rawNodes = topologyGraph?.nodes || [];
    const rawEdges = topologyGraph?.edges || [];

    // Map of nodes
    const nodeMap = new Map<string, CiTopologyNode>();
    rawNodes.forEach((n) => nodeMap.set(n.id.toLowerCase(), n));
    if (rawNodes.length === 0) {
      // Fall back to rootCi itself
      nodeMap.set(rootCi.id.toLowerCase(), {
        id: rootCi.id,
        name: rootCi.name,
        tag: rootCi.tag,
        type: rootCi.type,
        status: rootCi.status,
        lifecycleState: rootCi.lifecycleState,
        site: rootCi.site,
        businessOwner: rootCi.businessOwner,
        criticality: rootCi.criticality,
      });
    }

    const upNodes: CiTopologyNode[] = [];
    const downNodes: CiTopologyNode[] = [];

    const rootLowerId = rootCi.id.toLowerCase();
    const rootLowerTag = (rootCi.tag || '').toLowerCase();

    // From edges or rootCi.relationships
    const edgesList: CiTopologyEdge[] = [...rawEdges];
    if (edgesList.length === 0 && Array.isArray(rootCi.relationships)) {
      rootCi.relationships.forEach((r) => {
        edgesList.push({
          source: rootCi.id,
          target: r.targetCiId || r.targetCiTag,
          type: r.type,
          direction: r.direction,
        });
      });
    }

    edgesList.forEach((edge) => {
      const isSourceRoot = edge.source.toLowerCase() === rootLowerId || edge.source.toLowerCase() === rootLowerTag;
      const isTargetRoot = edge.target.toLowerCase() === rootLowerId || edge.target.toLowerCase() === rootLowerTag;

      const otherKey = isSourceRoot ? edge.target : edge.source;
      const otherLower = otherKey.toLowerCase();
      let node = nodeMap.get(otherLower);

      if (!node) {
        // Try to match from allCis
        const matched = allCis.find(
          (c) => c.id.toLowerCase() === otherLower || (c.tag && c.tag.toLowerCase() === otherLower)
        );
        if (matched) {
          node = {
            id: matched.id,
            name: matched.name,
            tag: matched.tag,
            type: matched.type,
            status: matched.status,
            lifecycleState: matched.lifecycleState,
            site: matched.site,
            businessOwner: matched.businessOwner,
          };
          nodeMap.set(otherLower, node);
        } else {
          // Synthetic node placeholder
          node = {
            id: otherKey,
            name: otherKey,
            tag: otherKey,
            type: 'Server',
            status: 'Active',
          };
          nodeMap.set(otherLower, node);
        }
      }

      if (edge.direction === 'upstream') {
        if (!upNodes.some((n) => n.id.toLowerCase() === node!.id.toLowerCase())) {
          upNodes.push(node);
        }
      } else {
        if (!downNodes.some((n) => n.id.toLowerCase() === node!.id.toLowerCase())) {
          downNodes.push(node);
        }
      }
    });

    const activeNodes = Array.from(nodeMap.values());

    const edges = edgesList.filter((e) => {
      if (selectedDirectionFilter === 'all') return true;
      return e.direction === selectedDirectionFilter;
    });

    return {
      upstreamNodes: upNodes,
      downstreamNodes: downNodes,
      allNodes: activeNodes,
      filteredEdges: edges,
    };
  }, [topologyGraph, rootCi, allCis, selectedDirectionFilter]);

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTargetId || !onLinkRelationship) return;
    setIsSubmittingLink(true);
    try {
      await onLinkRelationship(newTargetId, newRelType, newRelDirection);
      setShowAddLinkModal(false);
      setNewTargetId('');
    } finally {
      setIsSubmittingLink(false);
    }
  };

  return (
    <div className="w-full bg-slate-950 text-white rounded-3xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
      {/* Top Controls Toolbar */}
      <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#eb6a47]/20 border border-[#eb6a47]/40 flex items-center justify-center text-[#eb6a47]">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white tracking-tight">
                Visual Dependency Tree
              </span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-[#eb6a47] text-white">
                {rootCi.tag}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive topology mapping interconnected servers, databases, and microservices
            </p>
          </div>
        </div>

        {/* View & Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Direction Filter */}
          <div className="flex items-center bg-slate-800/80 rounded-xl p-0.5 border border-slate-700/60 text-xs">
            <button
              onClick={() => setSelectedDirectionFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedDirectionFilter === 'all'
                  ? 'bg-[#eb6a47] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Links ({filteredEdges.length})
            </button>
            <button
              onClick={() => setSelectedDirectionFilter('upstream')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedDirectionFilter === 'upstream'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Upstream ({upstreamNodes.length})
            </button>
            <button
              onClick={() => setSelectedDirectionFilter('downstream')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedDirectionFilter === 'downstream'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Downstream ({downstreamNodes.length})
            </button>
          </div>

          {/* Zoom buttons */}
          <div className="flex items-center bg-slate-800/80 rounded-xl p-0.5 border border-slate-700/60">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1.5 text-slate-300 font-bold">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg cursor-pointer border-l border-slate-700/60 ml-0.5"
              title="Reset Zoom"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>

          {/* Refresh */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Refresh topology"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}

          {/* Link New Relationship */}
          {onLinkRelationship && (
            <button
              onClick={() => setShowAddLinkModal(true)}
              className="px-3 py-1.5 bg-[#eb6a47] hover:bg-[#db5936] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Link Dependency</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        className="relative w-full p-6 sm:p-10 overflow-x-auto min-h-[460px] flex flex-col items-center justify-center bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]"
        style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center top' }}
      >
        {isLoading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#eb6a47] mb-3" />
            <p className="text-sm font-semibold text-slate-300">Traversing dependency graph & topological edges...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full max-w-4xl space-y-10">
            {/* 1. UPSTREAM TIER (Consumers, Applications, Gateways) */}
            {selectedDirectionFilter !== 'downstream' && (
              <div className="w-full flex flex-col items-center">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] uppercase font-mono font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3 rotate-90 sm:rotate-0" />
                    Upstream Consumers ({upstreamNodes.length})
                  </span>
                </div>

                {upstreamNodes.length === 0 ? (
                  <div className="p-3 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl text-xs text-slate-500 font-mono text-center max-w-xs">
                    No upstream consumers (this CI has no higher-tier callers)
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
                    {upstreamNodes.map((node) => {
                      const warranty = getWarrantyInfo((node as any).warrantyExpiry);
                      return (
                        <div
                          key={node.id}
                          onClick={() => onSelectCi && onSelectCi(node.id)}
                          className="bg-slate-900/90 border border-indigo-700/50 hover:border-indigo-400 rounded-2xl p-3.5 shadow-lg hover:shadow-indigo-500/10 transition-all cursor-pointer flex flex-col justify-between group relative"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-1.5">
                                {getCiIcon(node.type)}
                                <span className="font-mono font-bold text-xs text-indigo-400">
                                  {node.tag || node.id}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
                                {node.type}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors truncate">
                              {node.name}
                            </h4>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                            <span className="text-slate-400 truncate max-w-[120px]">{node.site || 'Datacenter'}</span>
                            {warranty && (
                              <span className={`px-1.5 py-0.5 rounded font-mono border ${warranty.className}`}>
                                {warranty.label}
                              </span>
                            )}
                          </div>

                          {/* Directed Connection Arrow Down to Root */}
                          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center">
                            <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-tighter px-1 rounded bg-slate-950">
                              calls
                            </span>
                            <div className="w-0.5 h-3 bg-indigo-500/60" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SVG Connecting Flow Lines (Upstream to Root) */}
            {upstreamNodes.length > 0 && selectedDirectionFilter !== 'downstream' && (
              <div className="w-full flex justify-center -my-4 relative z-0">
                <svg className="w-64 h-12 stroke-indigo-500/60" fill="none">
                  <path d="M 32 0 C 32 30, 128 10, 128 48" strokeWidth="2" strokeDasharray="4 2" />
                  <path d="M 224 0 C 224 30, 128 10, 128 48" strokeWidth="2" strokeDasharray="4 2" />
                  <circle cx="128" cy="48" r="4" fill="#6366f1" />
                </svg>
              </div>
            )}

            {/* 2. ROOT CI NODE (Centerpiece) */}
            <div className="relative z-10 w-full max-w-lg">
              <div className="p-1 rounded-3xl bg-gradient-to-r from-[#eb6a47] via-amber-500 to-[#c4674e] shadow-2xl shadow-[#eb6a47]/20">
                <div className="bg-slate-900 rounded-[22px] p-5 border border-slate-800">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-[#eb6a47]/20 border border-[#eb6a47]/50 rounded-2xl text-[#eb6a47]">
                        {getCiIcon(rootCi.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-sm text-[#eb6a47]">
                            {rootCi.tag}
                          </span>
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-[#eb6a47] text-white tracking-wider">
                            ROOT FOCAL CI
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-white mt-0.5">
                          {rootCi.name}
                        </h3>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                      {rootCi.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-3 p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-mono">Type</span>
                      <span className="font-bold text-slate-200">{rootCi.type}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-mono">Environment</span>
                      <span className="font-bold text-slate-200">{rootCi.environment}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-mono">Location</span>
                      <span className="font-bold text-slate-200 truncate block">{rootCi.site}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-500 uppercase block font-mono">IP Address</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {rootCi.ipAddress || rootCi.specifications?.ipAddress || 'DHCP'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-mono">Lifecycle</span>
                      <span className="font-bold text-amber-400">{rootCi.lifecycleState || 'Deployed'}</span>
                    </div>
                  </div>

                  {/* Warranty Expiry Indicator */}
                  {rootCi.warrantyExpiry && (
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Hardware Warranty Expiry
                      </span>
                      {(() => {
                        const w = getWarrantyInfo(rootCi.warrantyExpiry);
                        return w ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${w.className}`}>
                            {w.label}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono text-xs">{rootCi.warrantyExpiry}</span>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SVG Connecting Flow Lines (Root to Downstream) */}
            {downstreamNodes.length > 0 && selectedDirectionFilter !== 'upstream' && (
              <div className="w-full flex justify-center -my-4 relative z-0">
                <svg className="w-64 h-12 stroke-emerald-500/60" fill="none">
                  <path d="M 128 0 C 128 35, 32 15, 32 48" strokeWidth="2" strokeDasharray="4 2" />
                  <path d="M 128 0 C 128 35, 224 15, 224 48" strokeWidth="2" strokeDasharray="4 2" />
                  <circle cx="128" cy="0" r="4" fill="#10b981" />
                </svg>
              </div>
            )}

            {/* 3. DOWNSTREAM TIER (Databases, Storage, Backbone Networks, Caches) */}
            {selectedDirectionFilter !== 'upstream' && (
              <div className="w-full flex flex-col items-center">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] uppercase font-mono font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 rotate-90 sm:rotate-0" />
                    Downstream Dependencies ({downstreamNodes.length})
                  </span>
                </div>

                {downstreamNodes.length === 0 ? (
                  <div className="p-3 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl text-xs text-slate-500 font-mono text-center max-w-xs">
                    No downstream dependencies (standalone service)
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
                    {downstreamNodes.map((node) => {
                      const warranty = getWarrantyInfo((node as any).warrantyExpiry);
                      return (
                        <div
                          key={node.id}
                          onClick={() => onSelectCi && onSelectCi(node.id)}
                          className="bg-slate-900/90 border border-emerald-700/50 hover:border-emerald-400 rounded-2xl p-3.5 shadow-lg hover:shadow-emerald-500/10 transition-all cursor-pointer flex flex-col justify-between group relative"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-1.5">
                                {getCiIcon(node.type)}
                                <span className="font-mono font-bold text-xs text-emerald-400">
                                  {node.tag || node.id}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                                {node.type}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors truncate">
                              {node.name}
                            </h4>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                            <span className="text-slate-400 truncate max-w-[120px]">{node.site || 'Datacenter'}</span>
                            {warranty && (
                              <span className={`px-1.5 py-0.5 rounded font-mono border ${warranty.className}`}>
                                {warranty.label}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dependency Links Ledger Footer */}
      {filteredEdges.length > 0 && (
        <div className="px-5 py-3 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono text-[11px] uppercase tracking-wider font-bold">
              Active Connection Topology ({filteredEdges.length} edges):
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {filteredEdges.slice(0, 4).map((e, idx) => (
                <div
                  key={idx}
                  className="px-2 py-1 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[10px] flex items-center gap-1.5"
                >
                  <span className="text-amber-400 font-bold">{e.source}</span>
                  {e.direction === 'upstream' ? (
                    <ArrowLeft className="w-3 h-3 text-indigo-400" />
                  ) : (
                    <ArrowRight className="w-3 h-3 text-emerald-400" />
                  )}
                  <span className="text-sky-400 font-bold">{e.target}</span>
                  <span className="text-slate-500">({e.type})</span>
                  {onUnlinkRelationship && (
                    <button
                      onClick={(evt) => {
                        evt.stopPropagation();
                        onUnlinkRelationship(e.target);
                      }}
                      className="text-slate-500 hover:text-rose-400 ml-1 cursor-pointer"
                      title="Unlink relationship"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {filteredEdges.length > 4 && (
                <span className="text-slate-400 text-[10px] font-mono">
                  +{filteredEdges.length - 4} more
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Dependency Modal */}
      {showAddLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#eb6a47]" />
                <h3 className="font-bold text-sm">Link Dependency to {rootCi.tag}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddLinkModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLink} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Target CI (Component)</label>
                <select
                  required
                  value={newTargetId}
                  onChange={(e) => setNewTargetId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#eb6a47] cursor-pointer"
                >
                  <option value="">-- Select Target CI --</option>
                  {allCis
                    .filter((c) => c.id !== rootCi.id && c.tag !== rootCi.tag)
                    .map((c) => (
                      <option key={c.id} value={c.tag || c.id}>
                        {c.tag} — {c.name} ({c.type})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Relationship Type</label>
                  <select
                    value={newRelType}
                    onChange={(e) => setNewRelType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#eb6a47] cursor-pointer"
                  >
                    <option value="depends_on">depends_on</option>
                    <option value="runs_on">runs_on</option>
                    <option value="backed_up_by">backed_up_by</option>
                    <option value="connected_to">connected_to</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Direction</label>
                  <select
                    value={newRelDirection}
                    onChange={(e) => setNewRelDirection(e.target.value as 'upstream' | 'downstream')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#eb6a47] cursor-pointer"
                  >
                    <option value="downstream">Downstream (Root depends on target)</option>
                    <option value="upstream">Upstream (Target calls Root)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddLinkModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTargetId || isSubmittingLink}
                  className="px-4 py-2 bg-[#eb6a47] hover:bg-[#db5936] text-white rounded-xl font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingLink ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Save Connection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

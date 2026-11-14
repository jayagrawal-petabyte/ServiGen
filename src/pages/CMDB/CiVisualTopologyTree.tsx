import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { ConfigurationItem, CiType, CiRelationship } from '../../types/cmdb';
import type { CiTopologyGraph, CiTopologyNode, CiTopologyEdge } from '../../services/cmdbService';
import { RefreshButton } from '../../components/shared/RefreshButton';
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
  Minimize2,
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedDirectionFilter, setSelectedDirectionFilter] = useState<'all' | 'upstream' | 'downstream'>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [showAddLinkModal, setShowAddLinkModal] = useState<boolean>(false);
  const [newTargetId, setNewTargetId] = useState<string>('');
  const [newRelType, setNewRelType] = useState<string>('depends_on');
  const [newRelDirection, setNewRelDirection] = useState<'upstream' | 'downstream'>('downstream');
  const [isSubmittingLink, setIsSubmittingLink] = useState<boolean>(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Fullscreen management: handles native browser fullscreen API with CSS viewport fallback
  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen().catch(() => {});
        }
        setIsFullscreen(true);
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen((prev) => !prev);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Compute Warranty Status badge in clean theme colors
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
        className: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    }
    if (diffDays <= 90) {
      return {
        label: `Expiring: ${diffDays}d left`,
        variant: 'warning',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    }
    return {
      label: `Warranty: ${expiry.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`,
      variant: 'valid',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  };

  const getCiIcon = (type: string) => {
    switch (type) {
      case 'Database':
        return <Database className="w-4 h-4 text-indigo-600" />;
      case 'Network':
        return <Network className="w-4 h-4 text-emerald-600" />;
      case 'Cloud Service':
        return <Cloud className="w-4 h-4 text-sky-600" />;
      case 'Security':
        return <Shield className="w-4 h-4 text-rose-600" />;
      case 'Application':
        return <Layers className="w-4 h-4 text-violet-600" />;
      default:
        return <Server className="w-4 h-4 text-[#C96F55]" />;
    }
  };

  // Group nodes into topological tiers: Upstream -> Root CI -> Downstream
  const { upstreamNodes, downstreamNodes, allNodes, filteredEdges } = useMemo(() => {
    const rawNodes = topologyGraph?.nodes || [];
    const rawEdges = topologyGraph?.edges || [];

    // Map of nodes indexed by both id and tag (lowercase for case-insensitive lookup)
    const nodeMap = new Map<string, CiTopologyNode>();
    rawNodes.forEach((n) => {
      if (n.id) nodeMap.set(n.id.toLowerCase(), n);
      if (n.tag) nodeMap.set(n.tag.toLowerCase(), n);
    });

    if (rawNodes.length === 0) {
      const rootNode: CiTopologyNode = {
        id: rootCi.id,
        name: rootCi.name,
        tag: rootCi.tag,
        type: rootCi.type,
        status: rootCi.status,
        lifecycleState: rootCi.lifecycleState,
        site: rootCi.site,
        businessOwner: rootCi.businessOwner,
        criticality: rootCi.criticality,
      };
      if (rootCi.id) nodeMap.set(rootCi.id.toLowerCase(), rootNode);
      if (rootCi.tag) nodeMap.set(rootCi.tag.toLowerCase(), rootNode);
    }

    const upNodes: CiTopologyNode[] = [];
    const downNodes: CiTopologyNode[] = [];

    const rootLowerId = (rootCi.id || '').toLowerCase();
    const rootLowerTag = (rootCi.tag || '').toLowerCase();

    // From edges or direct relationships
    const edgesList: CiTopologyEdge[] = [...rawEdges];
    if (edgesList.length === 0) {
      // 1. Outgoing direct dependencies from rootCi
      if (Array.isArray(rootCi.relationships)) {
        rootCi.relationships.forEach((r) => {
          edgesList.push({
            source: rootCi.tag || rootCi.id,
            target: r.targetCiTag || r.targetCiId,
            type: r.type || 'depends_on',
            direction: r.direction || 'downstream',
          });
        });
      }
      // 2. Inbound links from other CIs in allCis pointing to rootCi
      if (Array.isArray(allCis)) {
        allCis.forEach((other) => {
          if (
            other.id.toLowerCase() === rootLowerId ||
            (other.tag && other.tag.toLowerCase() === rootLowerTag)
          ) {
            return;
          }
          if (Array.isArray(other.relationships)) {
            other.relationships.forEach((r) => {
              const targetKey = (r.targetCiTag || r.targetCiId || '').toLowerCase();
              if (targetKey === rootLowerId || targetKey === rootLowerTag) {
                edgesList.push({
                  source: other.tag || other.id,
                  target: rootCi.tag || rootCi.id,
                  type: r.type || 'runs_on',
                  direction: 'upstream',
                });
              }
            });
          }
        });
      }
    }

    edgesList.forEach((edge) => {
      const src = (edge.source || '').toLowerCase();
      const tgt = (edge.target || '').toLowerCase();
      const isSourceRoot = src === rootLowerId || src === rootLowerTag;
      const isTargetRoot = tgt === rootLowerId || tgt === rootLowerTag;

      if (!isSourceRoot && !isTargetRoot) {
        return;
      }

      const otherKey = isSourceRoot ? edge.target : edge.source;
      const otherLower = otherKey.toLowerCase();
      let node = nodeMap.get(otherLower);

      if (!node) {
        const matched = allCis.find(
          (c) =>
            c.id.toLowerCase() === otherLower ||
            (c.tag && c.tag.toLowerCase() === otherLower)
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
          if (matched.id) nodeMap.set(matched.id.toLowerCase(), node);
          if (matched.tag) nodeMap.set(matched.tag.toLowerCase(), node);
        } else {
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

      const isUpstream =
        edge.direction === 'upstream'
          ? isTargetRoot || !isSourceRoot
          : !isSourceRoot && isTargetRoot;

      const targetList = isUpstream ? upNodes : downNodes;
      const alreadyPresent = targetList.some(
        (n) =>
          n.id.toLowerCase() === node!.id.toLowerCase() ||
          (n.tag && node!.tag && n.tag.toLowerCase() === node!.tag.toLowerCase())
      );
      if (!alreadyPresent) {
        targetList.push(node);
      }
    });

    const activeNodes = Array.from(new Set(nodeMap.values()));

    const edges = edgesList.filter((e) => {
      const src = (e.source || '').toLowerCase();
      const tgt = (e.target || '').toLowerCase();
      const connectsToRoot =
        src === rootLowerId || src === rootLowerTag || tgt === rootLowerId || tgt === rootLowerTag;
      if (!connectsToRoot) return false;

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

  // Available options for linking new dependency (deduplicated against root CI)
  const availableCisToLink = useMemo(() => {
    const list: Array<{ id: string; tag: string; name: string; type: string }> = [];
    const seen = new Set<string>();
    const rootLowerId = (rootCi.id || '').toLowerCase();
    const rootLowerTag = (rootCi.tag || '').toLowerCase();

    // 1. From allCis
    allCis.forEach((c) => {
      const idLower = (c.id || '').toLowerCase();
      const tagLower = (c.tag || '').toLowerCase();
      if (idLower === rootLowerId || tagLower === rootLowerTag) return;
      const key = tagLower || idLower;
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ id: c.id, tag: c.tag || c.id, name: c.name, type: c.type || 'Server' });
      }
    });

    // 2. Fallback catalog items if allCis is small
    const defaults = [
      { id: 'CI-1001', tag: 'DB-001', name: 'Primary PostgreSQL Database Cluster', type: 'Database' },
      { id: 'CI-1002', tag: 'PAY-001', name: 'Payment Gateway Application Server', type: 'Server' },
      { id: 'CI-1003', tag: 'NET-001', name: 'Core Backbone Router 01', type: 'Network' },
      { id: 'CI-1004', tag: 'AWS-001', name: 'AWS Production Kubernetes Cluster (EKS)', type: 'Cloud Service' },
      { id: 'CI-1005', tag: 'SEC-001', name: 'Cloudflare Perimeter WAF & DDoS Shield', type: 'Security' },
      { id: 'CI-1006', tag: 'APP-001', name: 'Customer Portal Web App', type: 'Application' },
      { id: 'CI-1007', tag: 'SAN-001', name: 'SAN Backup Storage Vault', type: 'Server' },
      { id: 'CI-1008', tag: 'CACHE-001', name: 'Redis Session Cache Cluster', type: 'Cloud Service' },
      { id: 'CI-004', tag: 'CI-004', name: 'Application Server Node 04', type: 'Server' },
    ];

    defaults.forEach((d) => {
      const idLower = d.id.toLowerCase();
      const tagLower = d.tag.toLowerCase();
      if (idLower === rootLowerId || tagLower === rootLowerTag) return;
      const key = tagLower || idLower;
      if (!seen.has(key)) {
        seen.add(key);
        list.push(d);
      }
    });

    return list;
  }, [allCis, rootCi]);

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTargetId || !onLinkRelationship) return;
    setIsSubmittingLink(true);
    setLinkError(null);
    try {
      await onLinkRelationship(newTargetId, newRelType, newRelDirection);
      setShowAddLinkModal(false);
      setNewTargetId('');
    } catch (err: any) {
      setLinkError(err?.message || 'Failed to establish relationship link');
    } finally {
      setIsSubmittingLink(false);
    }
  };

  const handleUnlink = async (targetIdOrTag: string) => {
    if (!onUnlinkRelationship || !targetIdOrTag) return;
    try {
      await onUnlinkRelationship(targetIdOrTag);
    } catch (err: any) {
      console.error('Failed to unlink dependency:', err);
    }
  };

  return (
    <div
      ref={containerRef}
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen overflow-hidden flex flex-col bg-[#FFF9F5]'
          : 'w-full bg-[#FFF9F5] text-slate-800 rounded-3xl border border-[#EADBCE] overflow-hidden shadow-sm flex flex-col transition-all'
      }
    >
      {/* Top Controls Toolbar — Brand Styled */}
      <div className="px-5 py-3.5 bg-white/95 backdrop-blur-sm border-b border-[#EADBCE] flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#C96F55]/15 border border-[#C96F55]/30 flex items-center justify-center text-[#C96F55]">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                Visual Dependency Tree
              </span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-[#C96F55] text-white shadow-xs">
                {rootCi.tag}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Interactive topology mapping interconnected servers, databases, and microservices
            </p>
          </div>
        </div>

        {/* View & Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Direction Filter Tabs */}
          <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200 text-xs">
            <button
              onClick={() => setSelectedDirectionFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedDirectionFilter === 'all'
                  ? 'bg-[#C96F55] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Links ({upstreamNodes.length + downstreamNodes.length})
            </button>
            <button
              onClick={() => setSelectedDirectionFilter('upstream')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedDirectionFilter === 'upstream'
                  ? 'bg-[#263B5E] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upstream ({upstreamNodes.length})
            </button>
            <button
              onClick={() => setSelectedDirectionFilter('downstream')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedDirectionFilter === 'downstream'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Downstream ({downstreamNodes.length})
            </button>
          </div>

          {/* Zoom Buttons */}
          <div className="flex items-center bg-white rounded-xl p-0.5 border border-[#EADBCE] shadow-2xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="text-[11px] font-mono px-2 text-slate-700 hover:text-[#C96F55] font-bold cursor-pointer transition-colors"
              title="Click to reset zoom to 100%"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
              isFullscreen
                ? 'bg-[#C96F55] text-white border-[#C96F55] shadow-xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-[#EADBCE] shadow-2xs'
            }`}
            title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Full Screen'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Full Screen</span>
              </>
            )}
          </button>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 bg-white hover:bg-slate-50 border border-[#EADBCE] rounded-xl text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
              title="Refresh topology"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#C96F55]' : ''}`} />
            </button>
          )}

          {/* Link Dependency Button */}
          {onLinkRelationship && (
            <button
              onClick={() => setShowAddLinkModal(true)}
              className="px-3.5 py-1.5 bg-[#C96F55] hover:bg-[#B85E44] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Link Dependency</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Area — Soft Warm Cream with Subtle Dot Grid */}
      <div
        className="relative w-full p-6 sm:p-10 overflow-x-auto min-h-[480px] flex-1 flex flex-col items-center justify-center bg-[#FFF9F5] bg-[radial-gradient(#E2D4C9_1.2px,transparent_1.2px)] [background-size:24px_24px]"
        style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center top' }}
      >
        {isLoading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#C96F55] mb-3" />
            <p className="text-sm font-semibold text-slate-600">
              Traversing dependency graph & topological edges...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full max-w-4xl space-y-8 my-auto">
            {/* 1. UPSTREAM TIER (Consumers, Applications, Calling Gateways) */}
            {selectedDirectionFilter !== 'downstream' && (
              <div className="w-full flex flex-col items-center">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] uppercase font-mono font-extrabold tracking-wider px-3 py-1 rounded-full bg-[#263B5E]/10 text-[#263B5E] border border-[#263B5E]/20 flex items-center gap-1.5 shadow-2xs">
                    <ArrowLeft className="w-3 h-3 rotate-90 sm:rotate-0" />
                    Upstream Consumers ({upstreamNodes.length})
                  </span>
                </div>

                {upstreamNodes.length === 0 ? (
                  <div className="p-3.5 bg-white/80 border border-dashed border-[#EADBCE] rounded-2xl text-xs text-slate-400 font-mono text-center max-w-xs shadow-2xs">
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
                          className="bg-white border border-[#263B5E]/20 hover:border-[#263B5E] rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                {getCiIcon(node.type)}
                                <span className="font-mono font-bold text-xs text-[#263B5E]">
                                  {node.tag || node.id}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#263B5E]/10 text-[#263B5E] font-semibold border border-[#263B5E]/20">
                                {node.type}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#263B5E] transition-colors truncate">
                              {node.name}
                            </h4>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 truncate max-w-[120px]">
                              {node.site || 'Datacenter'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {warranty && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${warranty.className}`}
                                >
                                  {warranty.label}
                                </span>
                              )}
                              {onUnlinkRelationship && (
                                <button
                                  onClick={(evt) => {
                                    evt.stopPropagation();
                                    handleUnlink(node.tag || node.id);
                                  }}
                                  className="px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                  title={`Unlink ${node.tag || node.name}`}
                                >
                                  <Trash2 className="w-2.5 h-2.5 text-rose-600" />
                                  <span>Unlink</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Directed Call Indicator Pin */}
                          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center">
                            <span className="text-[9px] font-mono font-bold text-[#263B5E] uppercase tracking-wider px-1.5 py-0.2 rounded bg-white border border-[#263B5E]/25 shadow-2xs">
                              calls
                            </span>
                            <div className="w-0.5 h-2.5 bg-[#263B5E]/40" />
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
              <div className="w-full flex justify-center -my-3 relative z-0">
                <svg className="w-64 h-10 stroke-[#263B5E]/40" fill="none">
                  <path d="M 32 0 C 32 25, 128 10, 128 40" strokeWidth="2" strokeDasharray="4 2" />
                  <path d="M 224 0 C 224 25, 128 10, 128 40" strokeWidth="2" strokeDasharray="4 2" />
                  <circle cx="128" cy="40" r="3.5" fill="#263B5E" />
                </svg>
              </div>
            )}

            {/* 2. ROOT CI NODE (Centerpiece) */}
            <div className="relative z-10 w-full max-w-lg">
              <div className="p-1 rounded-3xl bg-gradient-to-r from-[#C96F55] via-amber-500 to-[#C96F55] shadow-xl shadow-[#C96F55]/15">
                <div className="bg-white rounded-[22px] p-5 border border-[#F0E4DC]">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-[#C96F55]/15 border border-[#C96F55]/30 rounded-2xl text-[#C96F55]">
                        {getCiIcon(rootCi.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-sm text-[#C96F55]">
                            {rootCi.tag}
                          </span>
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-[#C96F55] text-white tracking-wider shadow-2xs">
                            ROOT FOCAL CI
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                          {rootCi.name}
                        </h3>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {rootCi.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-3 p-3 bg-[#FFF9F5] rounded-xl border border-[#EADBCE] text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-mono">Type</span>
                      <span className="font-bold text-slate-800">{rootCi.type}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-mono">Environment</span>
                      <span className="font-bold text-slate-800">{rootCi.environment}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-mono">Location</span>
                      <span className="font-bold text-slate-800 truncate block">{rootCi.site}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 uppercase block font-mono">IP Address</span>
                      <span className="font-mono text-emerald-700 font-bold">
                        {rootCi.ipAddress || rootCi.specifications?.ipAddress || 'DHCP'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-mono">Lifecycle</span>
                      <span className="font-bold text-amber-700">{rootCi.lifecycleState || 'Deployed'}</span>
                    </div>
                  </div>

                  {/* Warranty Expiry Indicator */}
                  {rootCi.warrantyExpiry && (
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#FFF9F5] border border-[#EADBCE] text-xs">
                      <span className="text-slate-500 font-mono text-[11px] flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Hardware Warranty Expiry
                      </span>
                      {(() => {
                        const w = getWarrantyInfo(rootCi.warrantyExpiry);
                        return w ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${w.className}`}
                          >
                            {w.label}
                          </span>
                        ) : (
                          <span className="text-slate-700 font-mono text-xs">{rootCi.warrantyExpiry}</span>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SVG Connecting Flow Lines (Root to Downstream) */}
            {downstreamNodes.length > 0 && selectedDirectionFilter !== 'upstream' && (
              <div className="w-full flex justify-center -my-3 relative z-0">
                <svg className="w-64 h-10 stroke-emerald-600/50" fill="none">
                  <path d="M 128 0 C 128 30, 32 10, 32 40" strokeWidth="2" strokeDasharray="4 2" />
                  <path d="M 128 0 C 128 30, 224 10, 224 40" strokeWidth="2" strokeDasharray="4 2" />
                  <circle cx="128" cy="0" r="3.5" fill="#059669" />
                </svg>
              </div>
            )}

            {/* 3. DOWNSTREAM TIER (Databases, Storage, Backbone Networks, Caches) */}
            {selectedDirectionFilter !== 'upstream' && (
              <div className="w-full flex flex-col items-center">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] uppercase font-mono font-extrabold tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                    <ArrowRight className="w-3 h-3 rotate-90 sm:rotate-0" />
                    Downstream Dependencies ({downstreamNodes.length})
                  </span>
                </div>

                {downstreamNodes.length === 0 ? (
                  <div className="p-3.5 bg-white/80 border border-dashed border-[#EADBCE] rounded-2xl text-xs text-slate-400 font-mono text-center max-w-xs shadow-2xs">
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
                          className="bg-white border border-emerald-200 hover:border-emerald-500 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                {getCiIcon(node.type)}
                                <span className="font-mono font-bold text-xs text-emerald-700">
                                  {node.tag || node.id}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                                {node.type}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                              {node.name}
                            </h4>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 truncate max-w-[120px]">
                              {node.site || 'Datacenter'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {warranty && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${warranty.className}`}
                                >
                                  {warranty.label}
                                </span>
                              )}
                              {onUnlinkRelationship && (
                                <button
                                  onClick={(evt) => {
                                    evt.stopPropagation();
                                    handleUnlink(node.tag || node.id);
                                  }}
                                  className="px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                  title={`Unlink ${node.tag || node.name}`}
                                >
                                  <Trash2 className="w-2.5 h-2.5 text-rose-600" />
                                  <span>Unlink</span>
                                </button>
                              )}
                            </div>
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

      {/* Dependency Links Ledger Footer — Brand Styled with Clear Unlink Buttons */}
      {filteredEdges.length > 0 && (
        <div className="px-5 py-3 bg-white/95 backdrop-blur-sm border-t border-[#EADBCE] flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 font-mono text-[11px] uppercase tracking-wider font-bold">
              Active Connection Topology ({filteredEdges.length} edges):
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {filteredEdges.map((e, idx) => {
                const rootLowerId = (rootCi.id || '').toLowerCase();
                const rootLowerTag = (rootCi.tag || '').toLowerCase();
                const srcLower = (e.source || '').toLowerCase();
                const isSourceRoot = srcLower === rootLowerId || srcLower === rootLowerTag;
                const otherCi = isSourceRoot ? e.target : e.source;

                return (
                  <div
                    key={idx}
                    className="px-3 py-1.5 bg-[#FFF9F5] rounded-xl border border-[#EADBCE] font-mono text-xs flex items-center gap-2 shadow-2xs"
                  >
                    <span className="text-[#263B5E] font-bold">{e.source}</span>
                    {e.direction === 'upstream' ? (
                      <ArrowLeft className="w-3.5 h-3.5 text-[#263B5E]" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    <span className="text-[#C96F55] font-bold">{e.target}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-sans text-[10px] font-semibold border border-slate-200">
                      {e.type || 'connected_to'}
                    </span>
                    {onUnlinkRelationship && (
                      <button
                        onClick={(evt) => {
                          evt.stopPropagation();
                          handleUnlink(otherCi);
                        }}
                        className="ml-1 px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-sans font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all hover:scale-105 shadow-2xs"
                        title={`Unlink dependency between ${e.source} and ${e.target}`}
                      >
                        <Trash2 className="w-3 h-3 text-rose-600" />
                        <span>Unlink</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add Dependency Modal — Clean Brand Styled */}
      {showAddLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EADBCE] rounded-3xl p-6 w-full max-w-md shadow-2xl text-slate-900 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#C96F55]/15 border border-[#C96F55]/30 flex items-center justify-center text-[#C96F55]">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  Link Dependency to {rootCi.tag}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddLinkModal(false);
                  setLinkError(null);
                }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {linkError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                {linkError}
              </div>
            )}

            <form onSubmit={handleCreateLink} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Target Component / CI
                </label>
                <select
                  required
                  value={newTargetId}
                  onChange={(e) => setNewTargetId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#C96F55] cursor-pointer"
                >
                  <option value="">-- Select Target CI to Link --</option>
                  {availableCisToLink.map((c) => (
                    <option key={c.id} value={c.tag || c.id}>
                      {c.tag} — {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Relationship Type
                  </label>
                  <select
                    value={newRelType}
                    onChange={(e) => setNewRelType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#C96F55] cursor-pointer"
                  >
                    <option value="depends_on">depends_on</option>
                    <option value="runs_on">runs_on</option>
                    <option value="backed_up_by">backed_up_by</option>
                    <option value="connected_to">connected_to</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Direction
                  </label>
                  <select
                    value={newRelDirection}
                    onChange={(e) => setNewRelDirection(e.target.value as 'upstream' | 'downstream')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#C96F55] cursor-pointer"
                  >
                    <option value="downstream">Downstream (Root depends on target)</option>
                    <option value="upstream">Upstream (Target calls Root)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddLinkModal(false);
                    setLinkError(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTargetId || isSubmittingLink}
                  className="px-4 py-2 bg-[#C96F55] hover:bg-[#B85E44] text-white rounded-xl font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5 transition-all shadow-xs"
                >
                  {isSubmittingLink ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
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

export default CiVisualTopologyTree;

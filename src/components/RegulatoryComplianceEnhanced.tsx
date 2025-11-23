import { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertCircle, XCircle, ChevronDown, ChevronRight, BookOpen, TrendingUp, FileText, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Framework {
  id: string;
  framework_code: string;
  framework_name: string;
  regulatory_body: string;
}

interface Section {
  id: string;
  framework_id: string;
  section_number: string;
  section_title: string;
  section_text: string;
  cfr_citation: string;
}

interface Subsection {
  id: string;
  section_id: string;
  subsection_number: string;
  subsection_title: string;
  subsection_text: string;
  requirement_type: string;
  frequency: string;
}

interface Implementation {
  section_id?: string;
  subsection_id?: string;
  implementation_status: string;
  coverage_percentage: number;
  screen_location: string;
}

export function RegulatoryComplianceEnhanced() {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subsections, setSubsections] = useState<Subsection[]>([]);
  const [implementations, setImplementations] = useState<Implementation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFrameworks, setExpandedFrameworks] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [fwResult, sectionsResult, subsectionsResult, implResult] = await Promise.all([
      supabase.from('regulatory_frameworks').select('*').order('framework_code'),
      supabase.from('regulation_sections').select('*').order('display_order'),
      supabase.from('regulation_subsections').select('*').order('display_order'),
      supabase.from('section_implementations').select('*')
    ]);

    console.log('=== REGULATORY COMPLIANCE DATA LOAD ===');
    console.log('Frameworks:', fwResult.data?.length, fwResult.data);
    console.log('Sections:', sectionsResult.data?.length, sectionsResult.data);
    console.log('Subsections:', subsectionsResult.data?.length, subsectionsResult.data);
    console.log('Implementations:', implResult.data?.length, implResult.data);

    if (fwResult.data) {
      setFrameworks(fwResult.data);
      const regYY = fwResult.data.find(f => f.framework_code === 'REG_YY');
      console.log('REG_YY framework:', regYY);
      if (regYY) {
        setExpandedFrameworks(new Set([regYY.id]));
        console.log('Auto-expanding REG_YY:', regYY.id);
      }
    }
    if (sectionsResult.data) {
      setSections(sectionsResult.data);
      const lcrSection = sectionsResult.data.find(s => s.section_number === '252.30');
      console.log('LCR section:', lcrSection);
      if (lcrSection) {
        setExpandedSections(new Set([lcrSection.id]));
        console.log('Auto-expanding LCR section:', lcrSection.id);
      }
    }
    if (subsectionsResult.data) setSubsections(subsectionsResult.data);
    if (implResult.data) setImplementations(implResult.data);
    console.log('=== DATA LOAD COMPLETE ===');
    setLoading(false);
  };

  const toggleFramework = (id: string) => {
    const newExpanded = new Set(expandedFrameworks);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFrameworks(newExpanded);
  };

  const toggleSection = (id: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSections(newExpanded);
  };

  const getImplementation = (sectionId?: string, subsectionId?: string) => {
    return implementations.find(i =>
      (sectionId && i.section_id === sectionId) ||
      (subsectionId && i.subsection_id === subsectionId)
    );
  };

  const getStatusIcon = (impl?: Implementation) => {
    if (!impl) return <XCircle className="w-5 h-5 text-slate-400" />;
    if (impl.implementation_status === 'fully_implemented' || impl.coverage_percentage === 100) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    if (impl.implementation_status === 'partially_implemented') {
      return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  const getStatusColor = (impl?: Implementation) => {
    if (!impl) return 'bg-slate-50 border-slate-200';
    if (impl.implementation_status === 'fully_implemented' || impl.coverage_percentage === 100) {
      return 'bg-green-50 border-green-200';
    }
    if (impl.implementation_status === 'partially_implemented') {
      return 'bg-yellow-50 border-yellow-200';
    }
    return 'bg-red-50 border-red-200';
  };

  const getRequirementBadge = (type: string) => {
    const colors: Record<string, string> = {
      calculation: 'bg-purple-100 text-purple-800',
      reporting: 'bg-blue-100 text-blue-800',
      policy: 'bg-green-100 text-green-800',
      governance: 'bg-orange-100 text-orange-800',
      system: 'bg-red-100 text-red-800',
      documentation: 'bg-yellow-100 text-yellow-800',
      validation: 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-slate-100 text-slate-800';
  };

  // Calculate summary statistics
  const totalSubsections = subsections.length;
  const implementedSubsections = subsections.filter(ss => {
    const impl = getImplementation(undefined, ss.id);
    return impl && (impl.implementation_status === 'fully_implemented' || impl.coverage_percentage === 100);
  }).length;
  const partialSubsections = subsections.filter(ss => {
    const impl = getImplementation(undefined, ss.id);
    return impl && impl.implementation_status === 'partially_implemented';
  }).length;
  const notImplementedSubsections = totalSubsections - implementedSubsections - partialSubsections;
  const overallCoverage = totalSubsections > 0 ? Math.round((implementedSubsections / totalSubsections) * 100) : 0;

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading regulatory compliance data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-7 h-7 text-blue-600" />
          Regulatory Compliance Dashboard
        </h2>
        <p className="text-slate-600 mt-1">
          Comprehensive regulation-by-regulation, section-by-section compliance tracking
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Total Requirements</p>
          <p className="text-2xl font-bold text-slate-900">{totalSubsections}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4">
          <p className="text-sm text-slate-600">Fully Implemented</p>
          <p className="text-2xl font-bold text-green-600">{implementedSubsections}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-yellow-200 p-4">
          <p className="text-sm text-slate-600">Partially Implemented</p>
          <p className="text-2xl font-bold text-yellow-600">{partialSubsections}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4">
          <p className="text-sm text-slate-600">Not Implemented</p>
          <p className="text-2xl font-bold text-red-600">{notImplementedSubsections}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4">
          <p className="text-sm text-slate-600">Overall Coverage</p>
          <p className="text-2xl font-bold text-blue-600">{overallCoverage}%</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Granular Compliance Tracking - {totalSubsections} Requirements</h3>
            <p className="text-sm text-blue-800">
              This dashboard tracks compliance at the subsection level. Each regulation is broken down into sections
              (e.g., § 252.30), and each section contains multiple detailed subsections (e.g., § 252.30(a), § 252.30(b)).
              <strong> Regulation YY and § 252.30 (LCR) are auto-expanded below to show the data.</strong> Click any other
              section to expand and view its detailed requirements.
            </p>
          </div>
        </div>
      </div>

      {/* Frameworks Tree */}
      <div className="space-y-3">
        {frameworks.map(framework => {
          const frameworkSections = sections.filter(s => s.framework_id === framework.id);
          console.log(`Rendering ${framework.framework_code}: ${frameworkSections.length} sections, expanded: ${expandedFrameworks.has(framework.id)}`);
          const isExpanded = expandedFrameworks.has(framework.id);

          return (
            <div key={framework.id} className="bg-white rounded-xl shadow-sm border border-slate-200">
              {/* Framework Header */}
              <button
                onClick={() => toggleFramework(framework.id)}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-slate-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  )}
                  <Shield className="w-6 h-6 text-blue-600" />
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-slate-900">{framework.framework_name}</h3>
                    <p className="text-sm text-slate-600">{framework.regulatory_body}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600">{frameworkSections.length} sections</span>
                </div>
              </button>

              {/* Sections */}
              {isExpanded && frameworkSections.length > 0 && (
                <div className="border-t border-slate-200 p-4 space-y-2">
                  {frameworkSections.map(section => {
                    const sectionSubsections = subsections.filter(ss => ss.section_id === section.id);
                    const isSectionExpanded = expandedSections.has(section.id);
                    const sectionImpl = getImplementation(section.id);

                    // Calculate section-level stats
                    const sectionImplemented = sectionSubsections.filter(ss => {
                      const impl = getImplementation(undefined, ss.id);
                      return impl && (impl.implementation_status === 'fully_implemented' || impl.coverage_percentage === 100);
                    }).length;
                    const sectionCoverage = sectionSubsections.length > 0
                      ? Math.round((sectionImplemented / sectionSubsections.length) * 100)
                      : 0;

                    return (
                      <div key={section.id} className={`border rounded-lg ${getStatusColor(sectionImpl)}`}>
                        {/* Section Header */}
                        <button
                          onClick={() => toggleSection(section.id)}
                          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 hover:bg-opacity-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isSectionExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-600" />
                            )}
                            {getStatusIcon(sectionImpl)}
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-semibold text-slate-900">
                                  {section.section_number}
                                </span>
                                <span className="font-semibold text-slate-900">{section.section_title}</span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1">{section.cfr_citation}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm font-medium text-slate-900">{sectionCoverage}% Complete</p>
                              <p className="text-xs text-slate-600">
                                {sectionImplemented}/{sectionSubsections.length} requirements
                              </p>
                            </div>
                          </div>
                        </button>

                        {/* Subsections */}
                        {isSectionExpanded && (
                          <div className="border-t border-slate-200 p-4 space-y-2 bg-white">
                            <p className="text-sm font-medium text-slate-700 mb-3">
                              Detailed Requirements ({sectionSubsections.length}):
                            </p>
                            {sectionSubsections.map(subsection => {
                              const subsectionImpl = getImplementation(undefined, subsection.id);

                              return (
                                <div
                                  key={subsection.id}
                                  className={`border rounded p-3 ${getStatusColor(subsectionImpl)}`}
                                >
                                  <div className="flex items-start gap-2">
                                    {getStatusIcon(subsectionImpl)}
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 flex-wrap mb-2">
                                        <span className="font-mono text-xs font-semibold text-slate-900">
                                          {subsection.subsection_number}
                                        </span>
                                        {subsection.subsection_title && (
                                          <span className="font-medium text-sm text-slate-900">
                                            {subsection.subsection_title}
                                          </span>
                                        )}
                                        <span className={`text-xs px-2 py-0.5 rounded ${getRequirementBadge(subsection.requirement_type)}`}>
                                          {subsection.requirement_type}
                                        </span>
                                        {subsection.frequency && (
                                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                                            {subsection.frequency}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-700 mb-2">{subsection.subsection_text}</p>

                                      {subsectionImpl && (
                                        <div className="mt-2 pt-2 border-t border-slate-200">
                                          <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                              <span className="font-medium text-slate-700">Status: </span>
                                              <span className="text-slate-900">
                                                {subsectionImpl.implementation_status.replace('_', ' ')}
                                              </span>
                                            </div>
                                            <div>
                                              <span className="font-medium text-slate-700">Coverage: </span>
                                              <span className="text-slate-900">{subsectionImpl.coverage_percentage}%</span>
                                            </div>
                                            {subsectionImpl.screen_location && (
                                              <div className="col-span-2">
                                                <span className="font-medium text-slate-700">Location: </span>
                                                <span className="text-blue-600">{subsectionImpl.screen_location}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {!subsectionImpl && (
                                        <div className="mt-2 pt-2 border-t border-slate-200">
                                          <p className="text-xs text-red-600 font-medium">
                                            ⚠️ Not yet implemented - Gap identified
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {sectionSubsections.length === 0 && (
                              <p className="text-sm text-slate-500 italic text-center py-4">
                                No detailed subsections loaded yet. Section-level tracking available.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {isExpanded && frameworkSections.length === 0 && (
                <div className="p-6 text-center text-slate-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p>No detailed sections loaded for this regulation yet.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {frameworks.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 mb-2">No regulatory frameworks loaded</p>
          <p className="text-sm text-slate-500">Regulatory compliance data will appear here once populated</p>
        </div>
      )}
    </div>
  );
}

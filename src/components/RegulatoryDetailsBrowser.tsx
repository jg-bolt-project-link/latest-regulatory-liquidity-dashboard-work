import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, CheckCircle, AlertCircle, XCircle, BookOpen, FileText, Info, Search, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Framework {
  id: string;
  framework_code: string;
  framework_name: string;
  regulatory_body: string;
  description: string;
}

interface Section {
  id: string;
  section_number: string;
  section_title: string;
  section_text: string;
  cfr_citation: string;
  is_mandatory: boolean;
}

interface Subsection {
  id: string;
  subsection_number: string;
  subsection_title: string;
  subsection_text: string;
  requirement_type: string;
  is_mandatory: boolean;
  frequency: string;
}

interface Implementation {
  section_id?: string;
  subsection_id?: string;
  implementation_status: string;
  coverage_percentage: number;
  screen_location: string;
  gap_description: string;
}

export function RegulatoryDetailsBrowser() {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subsections, setSubsections] = useState<Subsection[]>([]);
  const [implementations, setImplementations] = useState<Implementation[]>([]);
  const [loading, setLoading] = useState(true);

  const [expandedFramework, setExpandedFramework] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedSubsection, setSelectedSubsection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

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

    if (fwResult.data) {
      setFrameworks(fwResult.data);
      // Auto-expand REG_YY to show data immediately
      const regYY = fwResult.data.find(f => f.framework_code === 'REG_YY');
      if (regYY) {
        setExpandedFramework(regYY.id);
      }
    }
    if (sectionsResult.data) {
      setSections(sectionsResult.data);
      // Auto-expand LCR section to show subsections immediately
      const lcrSection = sectionsResult.data.find(s => s.section_number === '252.30');
      if (lcrSection) {
        setExpandedSections(new Set([lcrSection.id]));
      }
    }
    if (subsectionsResult.data) setSubsections(subsectionsResult.data);
    if (implResult.data) setImplementations(implResult.data);
    setLoading(false);
  };

  const toggleFramework = (frameworkId: string) => {
    setExpandedFramework(expandedFramework === frameworkId ? null : frameworkId);
    setExpandedSections(new Set());
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results: any[] = [];

    // Search in sections
    sections.forEach(section => {
      if (
        section.section_title.toLowerCase().includes(query) ||
        section.section_text.toLowerCase().includes(query) ||
        section.cfr_citation.toLowerCase().includes(query) ||
        section.section_number.toLowerCase().includes(query)
      ) {
        const framework = frameworks.find(f => f.id === (section as any).framework_id);
        const impl = getImplementationStatus(section.id);
        results.push({
          type: 'section',
          framework: framework,
          section: section,
          implementation: impl
        });
      }
    });

    // Search in subsections
    subsections.forEach(subsection => {
      if (
        subsection.subsection_title.toLowerCase().includes(query) ||
        subsection.subsection_text.toLowerCase().includes(query) ||
        subsection.subsection_number.toLowerCase().includes(query)
      ) {
        const section = sections.find(s => s.id === (subsection as any).section_id);
        const framework = section ? frameworks.find(f => f.id === (section as any).framework_id) : null;
        const impl = getImplementationStatus(undefined, subsection.id);
        results.push({
          type: 'subsection',
          framework: framework,
          section: section,
          subsection: subsection,
          implementation: impl
        });
      }
    });

    setSearchResults(results);
    setShowSearchResults(true);
  };

  const navigateToResult = (result: any) => {
    if (result.framework) {
      setExpandedFramework(result.framework.id);
    }
    if (result.section) {
      const newExpanded = new Set(expandedSections);
      newExpanded.add(result.section.id);
      setExpandedSections(newExpanded);
    }
    setShowSearchResults(false);
    setTimeout(() => {
      const element = document.getElementById(result.subsection?.id || result.section?.id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-2', 'ring-blue-500');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-blue-500');
        }, 2000);
      }
    }, 300);
  };

  const getImplementationStatus = (sectionId?: string, subsectionId?: string) => {
    const impl = implementations.find(i =>
      (sectionId && i.section_id === sectionId) ||
      (subsectionId && i.subsection_id === subsectionId)
    );
    return impl;
  };

  const getStatusIcon = (status?: string, coverage?: number) => {
    if (!status) {
      return <XCircle className="w-4 h-4 text-slate-400" />;
    }
    if (status === 'fully_implemented' || (coverage && coverage === 100)) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    if (status === 'partially_implemented') {
      return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
    if (status === 'not_implemented') {
      return <XCircle className="w-4 h-4 text-red-600" />;
    }
    return <Info className="w-4 h-4 text-blue-600" />;
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-slate-50 border-slate-200';
    switch (status) {
      case 'fully_implemented': return 'bg-green-50 border-green-200';
      case 'partially_implemented': return 'bg-yellow-50 border-yellow-200';
      case 'not_implemented': return 'bg-red-50 border-red-200';
      case 'not_applicable': return 'bg-blue-50 border-blue-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  const getRequirementTypeBadge = (type: string) => {
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

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading regulatory details...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-blue-600" />
          Regulatory Requirements Browser
        </h2>
        <p className="text-slate-600 mt-1">
          Drill down into each regulation to view sections, subsections, and implementation status at granular level
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search regulations by text, citation, or requirement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
        {searchResults.length > 0 && showSearchResults && (
          <div className="mt-4 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">Found {searchResults.length} matches</h3>
              <button
                onClick={() => setShowSearchResults(false)}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Clear Results
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {searchResults.map((result, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => navigateToResult(result)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-blue-600">
                          {result.framework?.framework_code}
                        </span>
                        <span className="text-xs text-slate-500">
                          {result.type === 'section' ? result.section?.cfr_citation : result.section?.section_number}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-900">
                        {result.type === 'section' ? result.section?.section_title : result.subsection?.subsection_title}
                      </p>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {result.type === 'section' ? result.section?.section_text : result.subsection?.subsection_text}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.implementation && (
                        <div className="flex items-center gap-1">
                          {result.implementation.implementation_status === 'fully_implemented' && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                          {result.implementation.implementation_status === 'partially_implemented' && (
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                          )}
                          {result.implementation.implementation_status === 'not_implemented' && (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                      )}
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                  {result.implementation?.gap_description && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <p className="text-xs text-red-600 font-medium">Gap: {result.implementation.gap_description}</p>
                      <a
                        href="#regulatory-compliance"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = '#regulatory-compliance';
                        }}
                        className="text-xs text-blue-600 hover:underline mt-1 inline-flex items-center gap-1"
                      >
                        Analyze in Compliance Dashboard
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How to Use This Browser</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li><strong>Use the search bar above</strong> to find specific requirements by text or citation</li>
          <li><strong>Regulation YY and § 252.30 (LCR) are auto-expanded below</strong> to show 11 detailed LCR requirements</li>
          <li>Click any regulation to expand and view all sections</li>
          <li>Click any section to view detailed subsections and requirements</li>
          <li>Green checkmark = Fully implemented with screen/calculation</li>
          <li>Yellow warning = Partially implemented (gaps exist)</li>
          <li>Red X = Not implemented (gap identified)</li>
          <li>Search results with gaps link directly to the Compliance Dashboard for gap analysis</li>
        </ul>
      </div>

      {/* Frameworks Tree */}
      <div className="space-y-3">
        {frameworks.map(framework => {
          const frameworkSections = sections.filter(s => s.framework_id === framework.id);
          const isExpanded = expandedFramework === framework.id;

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
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-slate-900">{framework.framework_name}</h3>
                    <p className="text-sm text-slate-600">{framework.regulatory_body}</p>
                    <p className="text-xs text-slate-500 mt-1">{framework.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">{frameworkSections.length} sections</span>
                </div>
              </button>

              {/* Sections */}
              {isExpanded && frameworkSections.length > 0 && (
                <div className="border-t border-slate-200 p-4 space-y-2">
                  {frameworkSections.map(section => {
                    const sectionSubsections = subsections.filter(ss => ss.section_id === section.id);
                    const isSectionExpanded = expandedSections.has(section.id);
                    const sectionImpl = getImplementationStatus(section.id);

                    return (
                      <div id={section.id} key={section.id} className={`border rounded-lg transition-all ${getStatusColor(sectionImpl?.implementation_status)}`}>
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
                            {getStatusIcon(sectionImpl?.implementation_status, sectionImpl?.coverage_percentage)}
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
                          <div className="flex items-center gap-2">
                            {sectionImpl && (
                              <span className="text-xs px-2 py-1 rounded bg-white">
                                {sectionImpl.coverage_percentage}% complete
                              </span>
                            )}
                            <span className="text-xs text-slate-600">{sectionSubsections.length} requirements</span>
                          </div>
                        </button>

                        {/* Section Details */}
                        {isSectionExpanded && (
                          <div className="border-t border-slate-200 p-4 space-y-4 bg-white">
                            <div className="text-sm text-slate-700 bg-slate-50 rounded p-3">
                              <p className="font-medium text-slate-900 mb-2">Section Overview:</p>
                              <p>{section.section_text}</p>
                            </div>

                            {sectionImpl?.screen_location && (
                              <div className="bg-blue-50 rounded p-3 text-sm">
                                <p className="font-medium text-blue-900 mb-1">Implementation Location:</p>
                                <p className="text-blue-800">{sectionImpl.screen_location}</p>
                              </div>
                            )}

                            {/* Subsections */}
                            {sectionSubsections.length > 0 && (
                              <div className="space-y-2">
                                <p className="font-medium text-slate-900 text-sm">Detailed Requirements:</p>
                                {sectionSubsections.map(subsection => {
                                  const subsectionImpl = getImplementationStatus(undefined, subsection.id);

                                  return (
                                    <div
                                      id={subsection.id}
                                      key={subsection.id}
                                      className={`border rounded p-3 transition-all ${getStatusColor(subsectionImpl?.implementation_status)}`}
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-start gap-2 flex-1">
                                          {getStatusIcon(subsectionImpl?.implementation_status, subsectionImpl?.coverage_percentage)}
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="font-mono text-xs font-semibold text-slate-900">
                                                {subsection.subsection_number}
                                              </span>
                                              {subsection.subsection_title && (
                                                <span className="font-medium text-sm text-slate-900">
                                                  {subsection.subsection_title}
                                                </span>
                                              )}
                                              <span className={`text-xs px-2 py-0.5 rounded ${getRequirementTypeBadge(subsection.requirement_type)}`}>
                                                {subsection.requirement_type}
                                              </span>
                                              {subsection.is_mandatory && (
                                                <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-800">
                                                  MANDATORY
                                                </span>
                                              )}
                                              {subsection.frequency && (
                                                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                                                  {subsection.frequency}
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-xs text-slate-700 mt-2">{subsection.subsection_text}</p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Implementation Details */}
                                      {subsectionImpl && (
                                        <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                                          <div className="grid grid-cols-2 gap-3 text-xs">
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
                                                <span className="text-slate-900">{subsectionImpl.screen_location}</span>
                                              </div>
                                            )}
                                          </div>
                                          {subsectionImpl.gap_description && (
                                            <div className="bg-red-50 rounded p-2 text-xs">
                                              <p className="font-medium text-red-900 mb-1">Gap Identified:</p>
                                              <p className="text-red-800">{subsectionImpl.gap_description}</p>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {sectionSubsections.length === 0 && (
                              <p className="text-sm text-slate-500 italic">
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
                  <p className="text-sm mt-1">Check back after regulatory data is populated.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

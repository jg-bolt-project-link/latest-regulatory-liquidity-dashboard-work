import { MessageCircle, X, Send } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I can help you understand the data, regulations, and metrics in this application. Ask me about:\n\n• Data sources and lineage\n• Regulatory requirements (Basel III, Federal Reserve rules)\n• Specific metrics and their calculations\n• Data visualization and analytics\n• Navigation and features',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && chatContainerRef.current && !chatContainerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    setTimeout(() => {
      const response = generateResponse(inputValue);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const generateResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('lcr') || lowerQuery.includes('liquidity coverage')) {
      return 'The Liquidity Coverage Ratio (LCR) is a Basel III requirement that ensures banks have sufficient high-quality liquid assets (HQLA) to survive a 30-day stressed funding scenario.\n\n**Regulatory Requirements:**\n• Minimum LCR: 100%\n• Formula: LCR = (Total HQLA / Total Net Cash Outflows) × 100\n\n**Key References:**\n• [Basel III: The Liquidity Coverage Ratio (BCBS 238)](https://www.bis.org/publ/bcbs238.htm)\n• [Federal Reserve LCR Rule](https://www.federalreserve.gov/supervisionreg/topics/liquidity_coverage_ratio.htm)\n\nThe data shown comes from the lcr_metrics table in our analytics system.';
    }

    if (lowerQuery.includes('nsfr') || lowerQuery.includes('stable funding')) {
      return 'The Net Stable Funding Ratio (NSFR) is a Basel III metric ensuring banks maintain stable funding over a one-year horizon.\n\n**Regulatory Requirements:**\n• Minimum NSFR: 100%\n• Formula: NSFR = (Available Stable Funding / Required Stable Funding) × 100\n\n**Key References:**\n• [Basel III: The Net Stable Funding Ratio (BCBS 295)](https://www.bis.org/bcbs/publ/d295.htm)\n\nData is sourced from the nsfr_metrics table.';
    }

    if (lowerQuery.includes('tier 1') || lowerQuery.includes('capital')) {
      return 'Tier 1 Capital represents a bank\'s core capital, including common equity and disclosed reserves.\n\n**Regulatory Requirements:**\n• Minimum Tier 1 Ratio: 6% under Basel III\n• US G-SIBs face additional buffers (typically 8-10%+)\n• Enhanced Supplementary Leverage Ratio: 5% for US G-SIBs\n\n**Key References:**\n• [Basel III: Finalising Post-Crisis Reforms](https://www.bis.org/bcbs/publ/d424.htm)\n• [Federal Reserve - Capital Requirements](https://www.federalreserve.gov/supervisionreg/topics/capital.htm)\n\nData comes from State Street Corporation\'s publicly disclosed quarterly reports and the balance_sheet_metrics table.';
    }

    if (lowerQuery.includes('rcap') || lowerQuery.includes('rcen') || lowerQuery.includes('resolution')) {
      return 'Resolution metrics (RCAP/RCEN and RLAP/RLEN) ensure banks can execute orderly resolution if needed.\n\n**RCAP (Resolution Capital Adequacy Position):** Capital available for recapitalization in resolution\n**RCEN (Resolution Capital Execution Need):** Capital needed to execute resolution strategy\n**RLAP (Resolution Liquidity Adequacy Position):** Liquidity available in resolution\n**RLEN (Resolution Liquidity Execution Need):** Liquidity needed for resolution execution\n\n**Key References:**\n• [Federal Reserve - Resolution Planning](https://www.federalreserve.gov/supervisionreg/resolution-plans.htm)\n• Title I and Title II of Dodd-Frank Act\n\nData is representative and stored in resolution_capital_metrics and resolution_liquidity_metrics tables.';
    }

    if (lowerQuery.includes('data') && (lowerQuery.includes('source') || lowerQuery.includes('lineage') || lowerQuery.includes('quality'))) {
      return 'Data lineage, quality, and feeds can be explored using the eye icons next to each metric.\n\n**Data Sources:**\n• State Street Corporation public filings (actual regulatory data)\n• Internal analytics systems (representative data)\n• Federal Reserve regulatory reports\n\n**Data Quality Features:**\n• Completeness checks\n• Accuracy validation\n• Timeliness monitoring\n• Consistency verification\n\nClick any eye icon to see the full data lineage, quality checks, and feed information for that specific metric.';
    }

    if (lowerQuery.includes('fr2052a') || lowerQuery.includes('complex institution')) {
      return 'FR 2052a is the Federal Reserve\'s Complex Institution Liquidity Monitoring Report.\n\n**Purpose:** Collects detailed liquidity information from large banking organizations\n**Frequency:** Daily reporting for Category I institutions\n**Scope:** Covers cash flows, funding sources, and liquidity positions\n\n**Key References:**\n• [Federal Reserve FR 2052a Report](https://www.federalreserve.gov/apps/reportforms/reportdetail.aspx?sOoYJ+5BzDZJxMbV+J0JLg==)\n\nData is stored in fr2052a_submissions, fr2052a_data_rows, and related validation tables.';
    }

    if (lowerQuery.includes('navigate') || lowerQuery.includes('navigation') || lowerQuery.includes('how do i')) {
      return 'Navigation in this application:\n\n**Main Sections:**\n• Executive Dashboard - High-level overview\n• Regulatory Dashboard - Detailed compliance metrics\n• Data Quality Dashboard - Data validation and monitoring\n• FR 2052a Dashboard - Regulatory reporting\n\n**Navigation Features:**\n• Breadcrumbs at the top show your current path\n• Click X to return to the previous screen\n• Click metrics to drill down into details\n• Use eye icons for data lineage\n• Use text icons for regulatory references\n• Use table icons to see raw data\n\nEach detailed view has a back arrow or X button to return to the dashboard.';
    }

    if (lowerQuery.includes('icon') || lowerQuery.includes('eye') || lowerQuery.includes('text') || lowerQuery.includes('table')) {
      return 'Three icons appear next to metrics for deeper exploration:\n\n**Eye Icon 👁️** - Data Lineage & Quality\n• View data sources and predecessors\n• Check data quality metrics\n• See feed status and statistics\n\n**Text Icon 📄** - Regulatory References\n• View relevant regulatory requirements\n• Access hyperlinks to official regulatory text\n• Understand compliance context\n\n**Table Icon 📊** - Raw Data\n• View the actual database table values\n• See complete data records\n• Explore detailed calculations\n\nClick any icon to open a modal with the relevant information.';
    }

    if (lowerQuery.includes('visualiz') || lowerQuery.includes('chart') || lowerQuery.includes('graph') || lowerQuery.includes('trend') || lowerQuery.includes('analyt')) {
      return 'Data Visualization capabilities are available throughout the application:\n\n**How to Access:**\n• Look for the chart/visualization button (📊) on any data table screen\n• Click it to open the interactive visualization panel\n\n**Features:**\n• **Chart Types:** Bar charts, line charts, trend analysis\n• **Grouping:** Select attributes to group data (e.g., by product type, counterparty, maturity)\n• **Aggregation:** Sum, Average, Count, Min, Max of any numeric field\n• **Time Analysis:** Daily, weekly, monthly, quarterly, yearly trends\n• **Export:** Download aggregated data as CSV\n\n**Use Cases:**\n• Analyze HQLA composition by asset class\n• Track cash flow trends over time\n• Compare product categories\n• Identify concentration risks\n• Spot outliers and anomalies\n\nThe visualization engine automatically detects all available attributes in your data and allows you to build custom views.';
    }

    if (lowerQuery.includes('aggregate') || lowerQuery.includes('group by') || lowerQuery.includes('sum') || lowerQuery.includes('breakdown')) {
      return 'Data aggregation and grouping is available in the visualization tool:\n\n**Aggregation Functions:**\n• **Sum** - Total across all records\n• **Average** - Mean value\n• **Count** - Number of records\n• **Min/Max** - Minimum and maximum values\n\n**Grouping Options:**\nYou can group data by any categorical attribute:\n• Product categories and types\n• Counterparty types\n• Maturity buckets\n• Asset classes\n• Legal entities\n• Geographic regions\n\n**Multi-Level Grouping:**\nAdd multiple attributes to create nested breakdowns (e.g., "Product Category | Maturity Bucket | Counterparty Type")\n\n**Tips:**\n• Start with one grouping dimension, then add more\n• Use the + button to add attributes to your analysis\n• Click the - button to remove attributes\n• Export results to CSV for further analysis in Excel';
    }

    return 'I can help you with:\n\n• **Regulatory Metrics:** LCR, NSFR, Tier 1 Capital, Leverage Ratio, RCAP/RCEN\n• **Data Visualization:** Charts, trends, aggregations, and analytics\n• **Data & Lineage:** Data sources, quality checks, and feed information\n• **Reports:** FR 2052a, Balance Sheet, Resolution Planning\n• **Navigation:** How to use the application and its features\n\nWhat specific topic would you like to learn more about?';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 z-50"
          title="Open Assistant"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
      )}

      {isOpen && (
        <div ref={chatContainerRef} className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-xl shadow-2xl flex flex-col z-50 border border-slate-200">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-blue-600 text-white rounded-t-xl">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <h3 className="font-semibold">Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-blue-700 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-slate-500'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-slate-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about data, regulations, metrics..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { useState } from 'react';

type ReportType = 'note' | 'user' | 'comment';

export function useReportModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [type, setType] = useState<ReportType>('note');
  const [targetId, setTargetId] = useState('');

  const showReportModal = (reportType: ReportType, id: string) => {
    setType(reportType);
    setTargetId(id);
    setIsVisible(true);
  };

  const hideReportModal = () => {
    setIsVisible(false);
    setTargetId('');
  };

  return {
    isVisible,
    type,
    targetId,
    showReportModal,
    hideReportModal,
  };
}

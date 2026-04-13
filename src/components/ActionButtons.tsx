'use client';

import React from 'react';
import {Copy, Download, Share2} from 'lucide-react';
import {useTranslations} from 'next-intl';

type Props = {
  valueText: string;
  fileName: string;
};

export default function ActionButtons({valueText, fileName}: Props) {
  const t = useTranslations('Common');

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(valueText);
    } catch {
      // Silent on purpose for now
    }
  };

  const onShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({text: valueText});
      } else {
        await navigator.clipboard.writeText(valueText);
      }
    } catch {
      // Silent on purpose for now
    }
  };

  const onDownload = () => {
    const blob = new Blob([valueText], {type: 'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-10 grid grid-cols-3 gap-4">
      <ActionButton icon={<Copy size={20} />} label={t('copy')} onClick={onCopy} />
      <ActionButton icon={<Share2 size={20} />} label={t('share')} onClick={onShare} />
      <ActionButton icon={<Download size={20} />} label={t('download')} onClick={onDownload} />
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-background p-5 transition-all hover:border-brand/40 active:scale-95"
    >
      <div className="mb-2 text-gray-400 transition-colors group-hover:text-brand">{icon}</div>
      <span className="text-[9px] font-black uppercase tracking-wider text-gray-600 group-hover:text-gray-300">
        {label}
      </span>
    </button>
  );
}

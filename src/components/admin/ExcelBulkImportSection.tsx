import { useState, useRef } from 'react';
import { Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { importAPI, type BulkImportEntity } from '@/lib/api';

type Props = {
  entity: BulkImportEntity;
  /** Query keys to invalidate after a successful import (partial keys). */
  invalidateQueryKeys: string[][];
};

export function ExcelBulkImportSection({ entity, invalidateQueryKeys }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const title =
    entity === 'products'
      ? 'Import products from Excel'
      : entity === 'categories'
        ? 'Import categories from Excel'
        : entity === 'companies'
          ? 'Import companies from Excel'
          : 'Import brands from Excel';

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    try {
      const blob = await importAPI.downloadTemplate(entity);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entity}_import_template.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Template downloaded', description: 'Fill in your rows, then upload the file.' });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      toast({
        title: 'Download failed',
        description: err?.response?.data?.message || err?.message || 'Could not download template.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({ title: 'No file selected', description: 'Choose an .xlsx file first.', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const res = await importAPI.uploadExcel(entity, file);
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Import failed');
      }
      const { created, failed, errors, errors_truncated: truncated } = res.data;
      invalidateQueryKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      const errPreview =
        failed > 0 && errors?.length
          ? ` ${errors
              .slice(0, 5)
              .map((x) => `Row ${x.row}: ${x.error}`)
              .join(' · ')}${truncated || errors.length > 5 ? '…' : ''}`
          : '';
      toast({
        title: 'Import finished',
        description: `${created} created, ${failed} row(s) failed.${errPreview}`,
        variant: failed > 0 ? 'destructive' : 'default',
      });
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      setOpen(false);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; detail?: string } }; message?: string };
      toast({
        title: 'Upload failed',
        description:
          err?.response?.data?.message ||
          err?.response?.data?.detail ||
          err?.message ||
          'Import failed.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Import Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Download the template, add one row per record. Images are not used. For products,{' '}
            <strong>category_name</strong>, <strong>brand_name</strong>, and <strong>company_name</strong> must match
            existing records (or use *_id columns).
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <Button type="button" variant="secondary" className="w-full justify-start" onClick={handleDownloadTemplate} disabled={downloading}>
            {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Download template (.xlsx)
          </Button>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(ev) => setFile(ev.target.files?.[0] ?? null)}
            />
            <Button type="button" variant="outline" className="flex-1" onClick={() => inputRef.current?.click()}>
              Choose file
            </Button>
            <span className="text-xs text-muted-foreground truncate flex-1">{file?.name || 'No file'}</span>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleUpload} disabled={uploading || !file}>
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload & import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

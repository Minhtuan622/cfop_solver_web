import { Download, FileDown, FileUp } from "@/components/ui/Icon";
import { Dropdown, DropdownItem, MENU_ITEM_CLASS } from "@/components/ui/Dropdown";
import { useLanguage } from "@/contexts/LanguageContext";

export function HistoryTransferMenu({
  onImportJson,
  onImportCstimer,
  onExportJson,
  onExportCstimer,
  onExportCsv,
}: {
  onImportJson: () => void;
  onImportCstimer: () => void;
  onExportJson: () => void;
  onExportCstimer: () => void;
  onExportCsv: () => void;
}) {
  const { t } = useLanguage();
  return (
    <Dropdown
      id="history-transfer-menu"
      label={t("history.transferMenu")}
      variant="soft"
      button={
        <>
          <FileDown className="text-base" aria-hidden="true" />
          <span>{t("history.transferMenu")}</span>
        </>
      }
    >
      <DropdownItem className={MENU_ITEM_CLASS} onSelect={onImportJson}>
        <FileUp className="text-base" aria-hidden="true" />
        {t("history.importJson")}
      </DropdownItem>
      <DropdownItem className={MENU_ITEM_CLASS} onSelect={onImportCstimer}>
        <FileUp className="text-base" aria-hidden="true" />
        {t("history.importCstimer")}
      </DropdownItem>
      <DropdownItem className={MENU_ITEM_CLASS} onSelect={onExportJson}>
        <FileDown className="text-base" aria-hidden="true" />
        {t("history.exportJson")}
      </DropdownItem>
      <DropdownItem className={MENU_ITEM_CLASS} onSelect={onExportCstimer}>
        <FileDown className="text-base" aria-hidden="true" />
        {t("history.exportCstimer")}
      </DropdownItem>
      <DropdownItem className={MENU_ITEM_CLASS} onSelect={onExportCsv}>
        <Download className="text-base" aria-hidden="true" />
        {t("history.exportCsv")}
      </DropdownItem>
    </Dropdown>
  );
}

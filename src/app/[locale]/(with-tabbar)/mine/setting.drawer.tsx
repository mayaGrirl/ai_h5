import * as React from "react";
import {Drawer} from "vaul";
import {
  Banknote,
  Gift,
  HandCoins,
  Landmark,
  Mail,
  MessageCircleMore,
  PencilLine,
  ReceiptText,
  Repeat,
  ShieldEllipsis,
  ShieldPlus,
  ToolCase,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import {useTranslations} from "use-intl";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
};

export default function SettingDrawer({open, onOpenChange, locale}: Props) {
  const _t = useTranslations();

  const settingItems = [
    {label: _t("mine.setting.mail"), href: "", icon: Mail},
    {label: _t("mine.setting.receipt-text"), href: "", icon: ReceiptText},
    {label: _t("mine.setting.user"), href: "", icon: User},
    {label: _t("mine.setting.toolcase"), href: "", icon: ToolCase},
    {label: _t("mine.setting.gift"), href: "", icon: Gift},
    {label: _t("mine.setting.landmark"), href: "", icon: Landmark},
    {label: _t("mine.setting.repeat"), href: "", icon: Repeat},
    {label: _t("mine.setting.banknote"), href: "", icon: Banknote},
    {label: _t("mine.setting.hand-coins"), href: "", icon: HandCoins},
    {label: _t("mine.setting.message-circle-more"), href: "", icon: MessageCircleMore},
    {label: _t("mine.setting.shield-plus"), href: "", icon: ShieldPlus},
    {label: _t("mine.setting.shield-ellipsis"), href: "", icon: ShieldEllipsis},
    {label: _t("mine.setting.pencil-line"), href: "", icon: PencilLine},
    {label: _t("mine.setting.x"), href: "", icon: X},
  ];

  return (
    <Drawer.Root dismissible={false} open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        {/* 遮罩层 */}
        <Drawer.Overlay className="fixed inset-0 bg-black/40"/>
        <Drawer.Content
          className="fixed bottom-0 left-1/2 -translate-x-[51%] w-full max-w-xl z-[100] bg-white rounded-t-[10px]
            outline-none pb-[env(safe-area-inset-bottom)]"
        >
          <div className="p-4 rounded-t-[10px]">
            {/* Header */}
            <div className="relative flex items-center justify-center h-8">
              <Drawer.Title className="text-base font-medium text-gray-900">{_t("mine.setting.title")}</Drawer.Title>
              <button
                onClick={() => onOpenChange(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
              >
                <X className="h-7 w-7"/>
              </button>
            </div>

            {/* Menu */}
            <div className="p-4">
              <div className="grid grid-cols-4 gap-2 text-center">
                {settingItems.map(({label, href, icon: Icon}) => (
                  <Link key={label} href={`/${locale}/${href}`}
                        className="flex flex-col items-center justify-center gap-2 aspect-square rounded-lg
                    border border-[#ebedf0] cursor-pointer bg-white hover:bg-gray-50 active:bg-gray-100
                    transition-colors"
                  >
                    {/* 图标 */}
                    <div className="flex h-8 w-8 items-center justify-center text-gray-700">
                      <Icon className="h-7 w-7"/>
                    </div>

                    {/* 文案 */}
                    <span className="text-xs text-gray-700 text-center leading-tight">
                      {label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

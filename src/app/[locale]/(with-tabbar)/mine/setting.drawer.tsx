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
  ShieldPlus,
  ToolCase,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import {useState} from "react";
import {useTranslations} from "use-intl";
import {useRouter} from "next/navigation";
import {accessToken} from "@/utils/storage/token";
import {logout} from "@/api/auth";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
};

export default function SettingDrawer({open, onOpenChange, locale}: Props) {
  const router = useRouter();
  const _t = useTranslations();
  const [loggingOut, setLoggingOut] = useState(false);

  const settingItems = [
    {label: _t("mine.setting.mail"), href: "/mine/message", icon: Mail},
    {label: _t("mine.setting.receipt-text"), href: "/mine/receipt-text?from=drawer", icon: ReceiptText},
    {label: _t("mine.setting.profile"), href: "/mine/profile", icon: User},
    {label: _t("mine.setting.toolcase"), href: "/mine/toolcase", icon: ToolCase},
    {label: _t("mine.setting.gift"), href: "/mine/gift", icon: Gift},
    {label: _t("mine.setting.landmark"), href: "/mine/customer-transfer", icon: Landmark},
    {label: _t("mine.setting.repeat"), href: "/mine/repeat", icon: Repeat},
    {label: _t("mine.setting.salary"), href: "/mine/salary", icon: Banknote},
    {label: _t("mine.setting.hand-coins"), href: "/mine/hand-coins", icon: HandCoins},
    {label: _t("mine.setting.message-circle-more"), href: "/mine/message-circle-more", icon: MessageCircleMore},
    {label: _t("mine.setting.security-settings"), href: "/mine/security-settings", icon: ShieldPlus},
    // {label: _t("mine.setting.edit-password"), href: "/mine/security-settings/password", icon: ShieldEllipsis},
    {label: _t("mine.setting.edit-nickname"), href: "/mine/edit-nickname", icon: PencilLine},
    {label: _t("mine.setting.x"), href: "", icon: X},
  ];

  // 退出登录
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      // 调用后端退出接口（如果有）
      await logout();
    } catch (e) {
      // 即使接口失败，也继续本地退出
      console.error("logout error", e);
    } finally {
      // 清理前端状态
      accessToken.remove();

      // 关闭抽屉
      onOpenChange(false);

      // 跳转登录页
      router.replace(`/${locale}/auth/login`);
    }
  };

  return (
    <Drawer.Root dismissible={false} open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        {/* 遮罩层 */}
        <Drawer.Overlay className="fixed inset-0 bg-black/40"/>
        <Drawer.Content
          className="fixed bottom-0 left-1/2 -translate-x-[50%] w-full max-w-xl z-[100] bg-white rounded-t-[10px]
            outline-none pb-[env(safe-area-inset-bottom)]"
        >
          <div className="p-4 rounded-t-[10px]">
            {/* Header */}
            <div className="relative flex items-center justify-center h-8">
              <Drawer.Title className="text-base font-medium text-gray-900">{_t("mine.setting.title")}</Drawer.Title>
              <Drawer.Description className="sr-only"></Drawer.Description>
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
                {settingItems.map(({label, href, icon: Icon}) => {
                  if (href == "") {
                    return (
                      <button
                        key={label}
                        onClick={handleLogout}
                        className="flex flex-col items-center justify-center gap-2 aspect-square rounded-lg
                        border border-[#ebedf0] cursor-pointer bg-white hover:bg-gray-50 active:bg-gray-100
                        transition-colors"
                      >
                        <div className="flex h-8 w-8 items-center justify-center text-gray-700">
                          <Icon className="h-7 w-7"/>
                        </div>
                        <span className="text-xs text-gray-700 text-center leading-tight">
                          {label}
                        </span>
                      </button>
                    );
                  }

                  return (
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
                  )
                })}
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

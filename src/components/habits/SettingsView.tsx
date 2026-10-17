import { useState } from "react";
import { AlarmClockCheck, Bell, Monitor, Moon, Settings2, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PermissionState, ThemeMode } from "@/lib/storage";

const THEMES: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "system", label: "Системная", icon: Monitor },
  { value: "light", label: "Светлая", icon: Sun },
  { value: "dark", label: "Тёмная", icon: Moon },
];

const PERM_LABEL: Record<PermissionState, string> = {
  granted: "Разрешены",
  denied: "Запрещены",
  prompt: "Ещё не запрашивались",
  unsupported: "Доступны только в Android-приложении",
  unknown: "Неизвестно",
};

export const MANUAL_SETTINGS_HINT =
  "Откройте «Настройки» Android → «Приложения» → «Мои привычки» → «Уведомления» и включите их.";

export function SettingsView({
  theme,
  onTheme,
  permission,
  onRequest,
  onOpenSettings,
  exactAlarm,
  onExactAlarmRequest,
}: {
  theme: ThemeMode;
  onTheme: (t: ThemeMode) => void;
  permission: PermissionState;
  onRequest: () => void;
  onOpenSettings: () => Promise<boolean>;
  exactAlarm: PermissionState;
  onExactAlarmRequest: () => void;
}) {
  const [showHint, setShowHint] = useState(false);
  return (
    <div className="grid gap-6">
      <section aria-labelledby="theme-h" className="rounded-2xl border bg-card p-4">
        <h2 id="theme-h" className="mb-3 text-lg font-semibold">
          Тема оформления
        </h2>
        <div role="radiogroup" aria-label="Тема оформления" className="grid grid-cols-3 gap-2">
          {THEMES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              role="radio"
              aria-checked={theme === value}
              onClick={() => onTheme(value)}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border-2 px-1 text-sm font-medium transition-colors",
                theme === value
                  ? "border-primary bg-secondary text-secondary-foreground"
                  : "border-transparent bg-muted text-muted-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
              {theme === value && <span className="sr-only">(выбрано)</span>}
            </button>
          ))}
        </div>
      </section>
      <section aria-labelledby="notif-h" className="rounded-2xl border bg-card p-4">
        <h2 id="notif-h" className="mb-1 flex items-center gap-2 text-lg font-semibold">
          <Bell className="size-5" aria-hidden /> Уведомления
        </h2>
        <p className="text-sm text-muted-foreground">
          Статус: <span className="font-medium text-foreground">{PERM_LABEL[permission]}</span>
        </p>
        {permission === "denied" && (
          <p role="alert" className="mt-2 rounded-lg bg-accent p-3 text-sm text-accent-foreground">
            Разрешение на уведомления отключено. Включите его в настройках Android.
          </p>
        )}
        <div className="mt-3 grid gap-2">
          {permission === "prompt" && (
            <Button className="h-11" onClick={onRequest}>
              Разрешить уведомления
            </Button>
          )}
          {permission !== "unsupported" && (
            <Button
              variant="outline"
              className="h-11"
              onClick={async () => setShowHint(!(await onOpenSettings()))}
            >
              <Settings2 className="size-4" aria-hidden /> Открыть настройки приложения
            </Button>
          )}
          {(showHint || permission === "unsupported") && (
            <p className="text-sm text-muted-foreground">
              {permission === "unsupported"
                ? "Установите приложение на Android, чтобы получать напоминания."
                : MANUAL_SETTINGS_HINT}
            </p>
          )}
        </div>
      </section>
      <section aria-labelledby="exact-h" className="rounded-2xl border bg-card p-4">
        <h2 id="exact-h" className="mb-1 flex items-center gap-2 text-lg font-semibold">
          <AlarmClockCheck className="size-5" aria-hidden /> Точные напоминания
        </h2>
        <p className="text-sm text-muted-foreground">
          Статус: <span className="font-medium text-foreground">{PERM_LABEL[exactAlarm]}</span>
        </p>
        {exactAlarm === "denied" && (
          <p role="alert" className="mt-2 rounded-lg bg-accent p-3 text-sm text-accent-foreground">
            Без разрешения «Будильники и напоминания» Android может задерживать напоминания на
            несколько минут.
          </p>
        )}
        {exactAlarm === "denied" && (
          <Button className="mt-3 h-11" onClick={onExactAlarmRequest}>
            Включить точные напоминания
          </Button>
        )}
        {exactAlarm === "unsupported" && (
          <p className="mt-2 text-sm text-muted-foreground">
            Установите приложение на Android, чтобы настроить точность напоминаний.
          </p>
        )}
      </section>
      <p className="text-center text-xs text-muted-foreground">
        Мои привычки · данные хранятся только на этом устройстве
      </p>
    </div>
  );
}

param([int]$CompanionProcessId = 0, [switch]$Once)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
# Only process names and native window geometry are inspected. No UI text,
# notification contents, client databases, network, or account credentials.
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class MofuCornerWindow {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool SetProcessDpiAwarenessContext(IntPtr context);
  [DllImport("dwmapi.dll")] public static extern int DwmGetWindowAttribute(IntPtr h, int attribute, out RECT r, int size);
}
'@
[void][MofuCornerWindow]::SetProcessDpiAwarenessContext([IntPtr](-4))
# Cache process discovery; sample cheap native geometry separately for responsive dragging.
$client = $null
$nativeWindow = [IntPtr]::Zero
$nextDiscovery = [DateTime]::MinValue
$lastForegroundProcessId = 0
do {
  try {
    [uint32]$foregroundProcessId = 0
    [void][MofuCornerWindow]::GetWindowThreadProcessId([MofuCornerWindow]::GetForegroundWindow(), [ref]$foregroundProcessId)
    $foregroundChanged = $foregroundProcessId -ne $lastForegroundProcessId
    if ([DateTime]::UtcNow -ge $nextDiscovery -or ($foregroundChanged -and $foregroundProcessId -ne $CompanionProcessId) -or ($client -and -not [MofuCornerWindow]::IsWindow($nativeWindow))) {
      $candidates = @(Get-Process -Name Lark,Feishu -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 -and [MofuCornerWindow]::IsWindowVisible($_.MainWindowHandle) })
      $client = $candidates | Sort-Object @{ Expression = { $_.Id -eq $foregroundProcessId }; Descending = $true }, @{ Expression = { $_.MainWindowHandle -eq $nativeWindow }; Descending = $true }, Id | Select-Object -First 1
      $nativeWindow = if ($client) { [IntPtr]$client.MainWindowHandle } else { [IntPtr]::Zero }
      $brand = if ($client.ProcessName -ieq 'Feishu' -or $client.Path -match '\\Feishu\\') { 'feishu' } else { 'lark' }
      $nextDiscovery = [DateTime]::UtcNow.AddMilliseconds(1200)
    }
    $lastForegroundProcessId = $foregroundProcessId
    if (-not $client) { $result = @{ status = 'missing' } }
    else {
      $rect = [MofuCornerWindow+RECT]::new()
      $minimized = [MofuCornerWindow]::IsIconic($nativeWindow)
      if ($minimized -or [MofuCornerWindow]::DwmGetWindowAttribute($nativeWindow, 9, [ref]$rect, 16) -ne 0) { [void][MofuCornerWindow]::GetWindowRect($nativeWindow, [ref]$rect) }
      $result = @{ status = $(if ($minimized) { 'minimized' } else { 'ready' }); brand = $brand; pid = $client.Id; active = ($foregroundProcessId -eq $client.Id -or $foregroundProcessId -eq $CompanionProcessId); bounds = @{ x = $rect.Left; y = $rect.Top; width = $rect.Right - $rect.Left; height = $rect.Bottom - $rect.Top } }
    }
    $result | ConvertTo-Json -Compress
  } catch { @{ status = 'error' } | ConvertTo-Json -Compress }
  if (-not $Once) { Start-Sleep -Milliseconds 80 }
} while (-not $Once)

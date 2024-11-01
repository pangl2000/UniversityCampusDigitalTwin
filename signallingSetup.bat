@echo off

REM Run Dynamic and Static Matchmaker setup
powershell -Command "& {cd './PixelStreamingMultipleDynamic/Windows/DynamicModel/Samples/PixelStreaming/WebServers/SignallingWebServer/platform_scripts/cmd/'; ./setup.bat}"
powershell -Command "& {cd './PixelStreamingMultipleStatic/Windows/StaticModel/Samples/PixelStreaming/WebServers/SignallingWebServer/platform_scripts/cmd/'; ./setup.bat}"

REM Run Dynamic and Static Matchmaker once setup has completed
powershell -Command "Start-Process 'cmd' '/c call run_local.bat' -WorkingDirectory './PixelStreamingMultipleDynamic/Windows/DynamicModel/Samples/PixelStreaming/WebServers/SignallingWebServer/platform_scripts/cmd/'"
powershell -Command "Start-Process 'cmd' '/c call run_local.bat' -WorkingDirectory './PixelStreamingMultipleStatic/Windows/StaticModel/Samples/PixelStreaming/WebServers/SignallingWebServer/platform_scripts/cmd/'"

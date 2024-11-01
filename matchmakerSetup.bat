@echo off

REM Run Dynamic and Static Matchmaker setup
powershell -Command "& {cd './PixelStreamingMultipleDynamic/Windows/DynamicModel/Samples/PixelStreaming/WebServers/Matchmaker/platform_scripts/cmd/'; ./setup.bat}"
powershell -Command "& {cd './PixelStreamingMultipleStatic/Windows/StaticModel/Samples/PixelStreaming/WebServers/Matchmaker/platform_scripts/cmd/'; ./setup.bat}"

REM Run Dynamic and Static Matchmaker once setup has completed
powershell -Command "Start-Process 'cmd' '/c call run.bat' -WorkingDirectory './PixelStreamingMultipleDynamic/Windows/DynamicModel/Samples/PixelStreaming/WebServers/Matchmaker/platform_scripts/cmd/'"
powershell -Command "Start-Process 'cmd' '/c call run.bat' -WorkingDirectory './PixelStreamingMultipleStatic/Windows/StaticModel/Samples/PixelStreaming/WebServers/Matchmaker/platform_scripts/cmd/'"
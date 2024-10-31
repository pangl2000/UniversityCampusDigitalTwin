@echo off
cd /d "C:\Path\To\Your\Project" 

REM Run Dynamic Matchmaker setup and run
call ".\PixelStreamingMultipleDynamic\Windows\DynamicModel\Samples\PixelStreaming\WebServers\Matchmaker\platform_scripts\cmd\setup.bat"
call ".\PixelStreamingMultipleDynamic\Windows\DynamicModel\Samples\PixelStreaming\WebServers\Matchmaker\platform_scripts\cmd\run.bat"

REM Run Dynamic Signalling Server setup and run
call ".\PixelStreamingMultipleDynamic\Windows\DynamicModel\Samples\PixelStreaming\WebServers\SignallingWebServer\platform_scripts\cmd\setup.bat"
call ".\PixelStreamingMultipleDynamic\Windows\DynamicModel\Samples\PixelStreaming\WebServers\SignallingWebServer\platform_scripts\cmd\run_local.bat"

REM Run Static Matchmaker setup and run
call ".\PixelStreamingMultipleStatic\Windows\StaticModel\Samples\PixelStreaming\WebServers\Matchmaker\platform_scripts\cmd\setup.bat"
call ".\PixelStreamingMultipleStatic\Windows\StaticModel\Samples\PixelStreaming\WebServers\Matchmaker\platform_scripts\cmd\run.bat"

REM Run Static Signalling Server setup and run
call ".\PixelStreamingMultipleStatic\Windows\StaticModel\Samples\PixelStreaming\WebServers\SignallingWebServer\platform_scripts\cmd\setup.bat"
call ".\PixelStreamingMultipleStatic\Windows\StaticModel\Samples\PixelStreaming\WebServers\SignallingWebServer\platform_scripts\cmd\run_local.bat"

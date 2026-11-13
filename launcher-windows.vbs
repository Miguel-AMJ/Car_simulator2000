Set WshShell = CreateObject("WScript.Shell")
Set objArgs = WScript.Arguments
currentDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
cmdPath = currentDir & "\start-game.bat"
WshShell.Run """" & cmdPath & """", 1, false

# Your init script
#
# Atom will evaluate this file each time a new window is opened. It is run
# after packages are loaded/activated and after the previous editor state
# has been restored.
#
# An example hack to log to the console when each text editor is saved.
#
# atom.workspace.observeTextEditors (editor) ->
#   editor.onDidSave ->
#     console.log "Saved! #{editor.getPath()}"

atom.config.set 'welcome.showOnStartup', true

atom.commands.add 'atom-text-editor', 'custom:uploadOnlyThisFuckingFile', ->
    alert("key command activated");
    activePane = atom.workspace.getActivePane()
    workspaceView = atom.views.getView(atom.workspace);
    activePane.activate();
    atom.commands.dispatch(workspaceView, 'tree-view:reveal-active-file')
    atom.commands.dispatch(workspaceView, 'remote-ftp:upload-selected')

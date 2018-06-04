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

# atom.config.set 'welcome.showOnStartup', true



atom.commands.add 'atom-text-editor', 'custom:uploadOnlyThisFuckingFile', ->
    activePane = atom.workspace.getActivePane();
    workspaceView = atom.views.getView(atom.workspace);
    activePane.activate();
    atom.commands.dispatch(workspaceView, 'tree-view:reveal-active-file');
    setTimeout () ->
        atom.commands.dispatch(workspaceView, 'remote-ftp:upload-selected');
    , 100

 atom.commands.add 'atom-workspace', 'custom:downloadOnlyThisFuckingFile', ->
   activePane = atom.workspace.getActivePane()
   workspaceView = atom.views.getView(atom.workspace);
   activePane.activate();
   atom.commands.dispatch(workspaceView, 'tree-view:reveal-active-file')
   setTimeout () ->
      atom.commands.dispatch(workspaceView, 'remote-ftp:download-selected-local');
   , 100

 atom.commands.add 'atom-workspace', 'custom:semicolonize', ->
  editor = atom.workspace.getActiveTextEditor()
  editor.moveToEndOfLine()
  editor.insertText(";")

 atom.commands.add 'atom-workspace', 'custom:colonize', ->
  editor = atom.workspace.getActiveTextEditor()
  editor.moveToEndOfLine()
  editor.insertText(":")

 atom.commands.add 'atom-workspace', 'custom:bracketize', ->
  editor = atom.workspace.getActiveTextEditor()
  editor.moveToEndOfLine()
  editor.insertText(" {}")
  editor.moveLeft()

atom.contextMenu.add {
   '.tab': [
      {type: 'separator'},
      {
         label: 'Download',
         command: 'custom:downloadOnlyThisFuckingFile'
      },
      {
         label: 'Upload',
         command: 'custom:uploadOnlyThisFuckingFile'
      },
      {type: 'separator'}
   ]
}

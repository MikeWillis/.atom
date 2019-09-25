module.exports =
  deactivate: ->
    @toolBar?.removeItems()

  consumeToolBar: (toolBar) ->
    @toolBar = toolBar 'my-toolbar'

    if atom.packages.loadedPackages['project-manager']
      @toolBar.addButton
        'icon': 'file-submodule'
        'tooltip': 'Project List'
        'callback': 'project-manager:list-projects'

    @toolBar.addSpacer()

    @toolBar.addButton
      'icon': 'columns'
      'iconset': 'fa'
      'tooltip': 'Split screen - Horizontally'
      'callback': 'pane:split-right'

    btn = @toolBar.addButton
      'icon': 'columns'
      'iconset': 'fa'
      'tooltip': 'Split screen - Vertically'
      'callback': 'pane:split-down'
    btn.element.classList.add 'fa-rotate-270'

    @toolBar.addSpacer()

    @toolBar.addButton
      'iconset': 'fa'
      'icon': 'arrows-alt'
      'tooltip': 'Toggle Fullscreen'
      'callback': 'window:toggle-full-screen'

    @toolBar.addButton
      'icon': 'sitemap'
      'callback': 'tree-view:toggle'
      'tooltip': 'Toggle Sidebar'
      'iconset': 'fa'

    @toolBar.addButton
      'icon': 'git-compare'
      'callback': 'remote-ftp:toggle'
      'tooltip': 'Toggle Remote FTP'

    if atom.packages.loadedPackages['minimap']
      @toolBar.addButton
        'icon': 'eye'
        'tooltip': 'Toggle Minimap'
        'callback': 'minimap:toggle'

    if atom.packages.loadedPackages['expose']
      @toolBar.addButton
        'icon': 'browser'
        'tooltip': 'Toggle Exposé'
        'callback': 'expose:toggle'

    @toolBar.addSpacer()

    @toolBar.addButton
      'icon': 'indent'
      'callback': 'editor:auto-indent'
      'tooltip': 'Auto indent (selection)'
      'iconset': 'fa'

      @toolBar.addButton
        'icon': 'arrow-right'
        'callback': 'atom-beautify:beautify-editor'
        'tooltip': 'Beautify All'
        'iconset': 'fa'

    @toolBar.addSpacer()

    @toolBar.addButton
      icon: 'compress'
      callback: 'fold-functions:fold'
      tooltip: 'Collapse (Fold) Functions'
      iconset: 'fa'

    @toolBar.addButton
      icon: 'expand'
      callback: 'fold-functions:unfold'
      tooltip: 'Collapse (Fold) Functions'
      iconset: 'fa'

    @toolBar.addButton
      'icon': 'level-up-alt'
      'callback': 'editor:fold-all'
      'tooltip': 'Fold all'
      'iconset': 'fa'

    @toolBar.addButton
      'icon': 'level-down-alt'
      'callback': 'editor:unfold-all'
      'tooltip': 'Unfold all'
      'iconset': 'fa'

    if atom.packages.loadedPackages['atom-beautify']
      @toolBar.addButton
        'icon': 'star'
        'callback': 'atom-beautify:beautify-editor'
        'tooltip': 'Beautify'
        'iconset': 'fa'

    if atom.packages.loadedPackages['term3']
      @toolBar.addSpacer()
      @toolBar.addButton
        'icon': 'terminal'
        'callback': 'term3:open-split-down'
        'tooltip': 'Term3 Split Down'
    else if atom.packages.loadedPackages['term2']
      @toolBar.addSpacer()
      @toolBar.addButton
        'icon': 'terminal'
        'callback': 'term2:open-split-down'
        'tooltip': 'Term2 Split Down'
    else if atom.packages.loadedPackages['terminal-plus']
      @toolBar.addSpacer()
      @toolBar.addButton
        'icon': 'terminal'
        'callback': 'terminal-plus:toggle'
        'tooltip': 'Toggle Terminal-plus'

    if atom.inDevMode()

      @toolBar.addSpacer()

      @toolBar.addButton
        'icon': 'refresh'
        'callback': 'window:reload'
        'tooltip': 'Reload Window'
        'iconset': 'ion'

      @toolBar.addButton
        'icon': 'bug'
        'callback': 'window:toggle-dev-tools'
        'tooltip': 'Toggle Developer Tools'

    if atom.packages.loadedPackages['git-plus']
      @toolBar.addSpacer()
      @toolBar.addButton
        'icon' : 'git-plain'
        'callback' : 'git-plus:menu'
        'tooltip' : 'Git plus'
        'iconset' : 'devicon'

    if atom.packages.loadedPackages['script']
      @toolBar.addSpacer()
      @toolBar.addButton
        'icon': 'play'
        'callback': 'script:run'
        'tooltip': 'Run script'
        'iconset': 'fa'
      @toolBar.addButton
        'icon': 'fast-forward'
        'callback': 'script:run-by-line-number'
        'tooltip': 'Run by Line Number'
        'iconset': 'fa'
      @toolBar.addButton
        'icon': 'stop'
        'callback': 'script:kill-process'
        'tooltip': 'Stop script'
        'iconset': 'fa'
      @toolBar.addButton
        'icon': 'gear'
        'callback': 'script:run-options'
        'tooltip': 'Configure script'
        'iconset': 'fa'

    @toolBar.addSpacer()
    commentLine = atom.config.get('tool-bar-shortcuts.commentLine')
    commentBlock = atom.config.get('tool-bar-shortcuts.commentBlock')

    @toolBar.addButton
        icon: 'pound'
        callback: 'editor:toggle-line-comments'
        tooltip: 'Comment Line (toggle)'
        iconset: 'ion'

    if commentBlock
            @toolBar.addButton
                icon: 'quote'
                callback: 'block-comment:toggle'
                tooltip: 'Comment Block (toggle)'
                iconset: 'ion'

    @toolBar.addSpacer()

    if atom.packages.loadedPackages['markdown-preview']
      @toolBar.addButton
        'icon': 'markdown'
        'callback': 'markdown-preview:toggle'
        'tooltip': 'Markdown Preview'

    if atom.packages.loadedPackages['atom-html-preview']
      @toolBar.addButton
        'icon': 'globe'
        'callback': 'atom-html-preview:toggle'
        'tooltip': 'HTML Preview'

    @toolBar.addButton
        icon: 'list-alt'
        callback: 'editor:toggle-soft-wrap'
        tooltip: 'Toggle Word Wrap'
        iconset: 'fa'

    @toolBar.addButton
        icon: 'ellipsis-h'
        callback: 'editor:fold-selection'
        tooltip: 'Collapse (Fold) Section'
        iconset: 'fa'

    @toolBar.addSpacer()

    @toolBar.addButton
      icon: 'navicon-round'
      callback: 'command-palette:toggle'
      tooltip: 'Toggle Command Palette'
      iconset: 'ion'

    @toolBar.addButton
        icon: 'refresh'
        callback: 'window:reload'
        tooltip: 'Reload Window'
        iconset: 'ion'

    @toolBar.addButton
      'icon': 'gear'
      'callback': 'settings-view:open'
      'tooltip': 'Open Settings View'

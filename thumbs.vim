" just copying and changing from
" https://github.com/kchmck/vim-coffee-script/blob/master/syntax/coffee.vim
"
" add the following to ~/.vim/filetype.vim
  "au BufRead,BufNewFile *.thumbs setfiletype thumbs

" add this file (this one, thumbs.vim) to ~/.vim/syntax/

if exists('b:current_syntax') && b:current_syntax == 'thumbs'
  finish
endif

" syn cluster thumbsCallFunc contains=thumbsDot,thumbsStatement


syn match thumbsStatement /\w\+\ze\.\s/ display
hi def link thumbsStatement Statement

" TODO: how do I make the . lighter color?

syn match thumbsString /\w\+\ze\'\s/ display
hi def link thumbsString String

syn match thumbsDot /foo\zs\./ display
hi def link thumbsDot Comment



if !exists('b:current_syntax')
  let b:current_syntax = 'thumbs'
endif





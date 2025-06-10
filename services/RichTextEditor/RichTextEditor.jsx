import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  ToggleButton,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatListBulleted,
  FormatListNumbered,
  Undo,
  Redo,
} from '@mui/icons-material';

const RichTextEditor = ({ value, onChange }) => {
  const [fontSize, setFontSize] = useState('12pt');
  const [align, setAlign] = useState('left');
  const editorRef = useRef(null);

  const focusEditor = () => {
    if (editorRef.current) editorRef.current.focus();
  };

  const format = (cmd, arg = null) => {
    document.execCommand(cmd, false, arg);
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    focusEditor();
  };

  const handleFontSize = (e) => {
    setFontSize(e.target.value);
    document.execCommand('fontSize', false, '7');
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      let el = selection.anchorNode.parentNode;
      if (el && el.nodeName === 'FONT') {
        el.removeAttribute('size');
        el.style.fontSize = e.target.value;
      }
    }
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    focusEditor();
  };

  const handleAlign = (event, newAlign) => {
    if (!newAlign) return;
    setAlign(newAlign);
    if (newAlign === 'left') format('justifyLeft');
    if (newAlign === 'center') format('justifyCenter');
    if (newAlign === 'right') format('justifyRight');
    focusEditor();
  };

  const handleInput = () => {
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b': e.preventDefault(); format('bold'); break;
        case 'i': e.preventDefault(); format('italic'); break;
        case 'u': e.preventDefault(); format('underline'); break;
        default: break;
      }
    }
  };

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  return (
   <Box
    sx={{
      border: '1px solid #00AEEF',
      borderRadius: 2,
      overflow: 'hidden',
    }}>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        p: 1.5,
        borderBottom: '1px solid #00AEEF',
        gap: 1.5
      }}>
      <ToggleButton value="bold" onClick={() => format('bold')} sx={{ border: '1px solid #00AEEF', color: '#1120A3', width: 40, height: 40 }}><FormatBold /></ToggleButton>
      <ToggleButton value="italic" onClick={() => format('italic')} sx={{ border: '1px solid #00AEEF', color: '#1120A3', width: 40, height: 40 }}><FormatItalic /></ToggleButton>
      <ToggleButton value="underline" onClick={() => format('underline')} sx={{ border: '1px solid #00AEEF', color: '#1120A3', width: 40, height: 40 }}><FormatUnderlined /></ToggleButton>

      <ToggleButton value="left" onClick={() => format('justifyLeft')} sx={{ border: '1px solid #00AEEF', color: '#1120A3', width: 40, height: 40 }}><FormatAlignLeft /></ToggleButton>
      <ToggleButton value="center" onClick={() => format('justifyCenter')} sx={{ border: '1px solid #00AEEF', color: '#1120A3', width: 40, height: 40 }}><FormatAlignCenter /></ToggleButton>
      <ToggleButton value="right" onClick={() => format('justifyRight')} sx={{ border: '1px solid #00AEEF', color: '#1120A3', width: 40, height: 40 }}><FormatAlignRight /></ToggleButton>

      <ToggleButton value="ul" onClick={() => format('insertUnorderedList')} sx={{ border: '1px solid #00AEEF', color: '#1120A3', width: 40, height: 40 }}><FormatListBulleted /></ToggleButton>
      <ToggleButton value="ol" onClick={() => format('insertOrderedList')} sx={{ border: '1px solid #00AEEF', color: '#1120A3', width: 40, height: 40 }}><FormatListNumbered /></ToggleButton>

      <Box sx={{ display: 'flex', alignItems: 'center', height: 40 }}>
        <Select
          size="small"
          value={fontSize}
          onChange={handleFontSize}
          sx={{ height: 40, minWidth: 84, border: '1px solid #00AEEF', borderRadius: 0.5, background: '#fff', color: '#1120A3' }}>
          <MenuItem value="10pt">10 pt</MenuItem>
          <MenuItem value="12pt">12 pt</MenuItem>
          <MenuItem value="14pt">14 pt</MenuItem>
        </Select>
      </Box>

      <IconButton onClick={() => format('undo')} size="small" sx={{ border: '1px solid #00AEEF', color: '#1120A3', borderRadius: 0, width: 40, height: 40 }}><Undo /></IconButton>
      <IconButton onClick={() => format('redo')} size="small" sx={{ border: '1px solid #00AEEF', color: '#1120A3', borderRadius: 0, width: 40, height: 40 }}><Redo /></IconButton>
    </Box>

    <Box
      ref={editorRef}
      contentEditable
      spellCheck={true}
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      sx={{
        minHeight: 140,
        fontSize: fontSize,
        fontFamily: 'inherit',
        outline: 'none',
        border: 'none',
        width: '100%',
        p: 2,
        background: '#fff',
        wordBreak: 'break-word'
      }}
      placeholder="พิมพ์เนื้อหาข่าวสารที่นี่..."
      data-placeholder="พิมพ์เนื้อหาข่าวสารที่นี่..."
    />
  </Box>
  );
};

export default RichTextEditor;
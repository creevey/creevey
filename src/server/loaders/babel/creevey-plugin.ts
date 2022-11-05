import path from 'path';
import { NodePath, Binding, TraverseOptions } from '@babel/traverse';
import { commonVisitor, FileType, mdxVisitor, previewVisitor, storyVisitor, VisitorState } from './helpers.js';
import { logger } from '../../logger.js';

let lastStoryFile: string | null = null;
const stories = new Set<string>();
const reexportedStories = new Map<string, Set<string>>();

interface PluginState {
  opts: {
    debug: boolean;
    preview: string;
    parents: () => string[] | null;
    story: () => string | null;
    resetStory: () => void;
  };
  filename: string;
}

export default function (): unknown {
  return {
    pre(this: VisitorState & PluginState) {
      const parents = this.opts.parents() ?? [];
      const story = this.opts.story();
      this.resourcePath = this.filename;
      this.fileType = FileType.Invalid;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.visitedTopPaths = new Set<NodePath<any>>();
      this.visitedBindings = new Set<Binding>();
      this.reexportedStories = reexportedStories;
      if ((story && this.filename.startsWith(story)) || parents.find((parent) => this.reexportedStories.has(parent))) {
        this.fileType = FileType.Story;
        this.isMDX = path.parse(this.filename).ext == '.mdx';
        lastStoryFile = this.filename;
        stories.add(this.filename);
      } else if (this.filename.startsWith(this.opts.preview)) this.fileType = FileType.Preview;
      else if (lastStoryFile && this.opts.debug) {
        logger.warn(
          'Trying to transform possible non-story file',
          this.resourcePath,
          'Please check the',
          lastStoryFile,
        );
        lastStoryFile = null;
        // TODO Add link to docs, how creevey works and what user should do in this situation
      }
    },
    visitor: {
      ...commonVisitor,
      ExportAllDeclaration(path) {
        if (this.fileType == FileType.Story && typeof storyVisitor.ExportAllDeclaration == 'function') {
          storyVisitor.ExportAllDeclaration.call(this, path, this);
        }
      },
      ExportDefaultDeclaration(path) {
        if (this.fileType == FileType.Story && typeof storyVisitor.ExportDefaultDeclaration == 'function') {
          storyVisitor.ExportDefaultDeclaration.call(this, path, this);
        }
      },
      ExportNamedDeclaration(path) {
        if (this.fileType == FileType.Preview && typeof previewVisitor.ExportNamedDeclaration == 'function') {
          previewVisitor.ExportNamedDeclaration.call(this, path, this);
        }
        if (this.fileType == FileType.Story && typeof storyVisitor.ExportNamedDeclaration == 'function') {
          storyVisitor.ExportNamedDeclaration.call(this, path, this);
        }
      },
      CallExpression(path) {
        if (this.fileType == FileType.Preview && typeof previewVisitor.CallExpression == 'function') {
          previewVisitor.CallExpression.call(this, path, this);
        }
        if (this.fileType == FileType.Story && typeof storyVisitor.CallExpression == 'function') {
          storyVisitor.CallExpression.call(this, path, this);
        }
      },
      FunctionDeclaration(path) {
        if (this.isMDX && typeof mdxVisitor.FunctionDeclaration == 'function') {
          mdxVisitor.FunctionDeclaration.call(this, path, this);
        }
      },
    } as TraverseOptions<VisitorState>,
  };
}

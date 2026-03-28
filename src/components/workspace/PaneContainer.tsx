import { Fragment } from 'react'
import { Panel, Group, Separator } from 'react-resizable-panels'
import { useWorkspaceStore } from '../../store/workspaceStore'
import type { PaneNode, PaneLeaf, PaneSplit } from '../../store/workspaceTypes'
import TabBar from './TabBar'
import DocumentRenderer from './DocumentRenderer'
import WelcomeTab from './WelcomeTab'

interface PaneContainerProps {
  node: PaneNode
}

function LeafPane({ leaf, isOnlyPane }: { leaf: PaneLeaf; isOnlyPane?: boolean }) {
  const { activePaneId, setActivePaneId } = useWorkspaceStore()
  const isActive = activePaneId === leaf.id
  const activeTab = leaf.activeTabIndex >= 0 ? leaf.tabs[leaf.activeTabIndex] : null

  return (
    <div
      className={`flex flex-col h-full ${!isOnlyPane && isActive ? 'ring-1 ring-brand/20' : ''}`}
      onClick={() => setActivePaneId(leaf.id)}
    >
      <TabBar leaf={leaf} />
      <div className="flex-1 overflow-hidden min-h-0">
        {activeTab ? (
          <DocumentRenderer docId={activeTab.docId} paneId={leaf.id} />
        ) : (
          <WelcomeTab paneId={leaf.id} />
        )}
      </div>
    </div>
  )
}

function SplitPane({ split }: { split: PaneSplit }) {
  // react-resizable-panels v4: orientation, Panel/Separator 必须是 Group 直接子元素
  return (
    <Group orientation={split.direction} className="h-full w-full">
      {split.children.map((child, i) => (
        <Fragment key={child.id}>
          {i > 0 && (
            <Separator>
              <div
                className={`${
                  split.direction === 'horizontal' ? 'w-[3px] h-full' : 'h-[3px] w-full'
                } bg-ds-surface-container-high/60 hover:bg-brand/20 transition-colors`}
              />
            </Separator>
          )}
          <Panel
            id={child.id}
            defaultSize={split.sizes[i] ? `${split.sizes[i]}%` : undefined}
            minSize="15%"
            style={{ overflow: 'hidden' }}
          >
            <PaneContainer node={child} />
          </Panel>
        </Fragment>
      ))}
    </Group>
  )
}

export default function PaneContainer({ node, isRoot }: PaneContainerProps & { isRoot?: boolean }) {
  if (node.kind === 'leaf') {
    return <LeafPane leaf={node} isOnlyPane={isRoot && node.kind === 'leaf'} />
  }
  return <SplitPane split={node} />
}

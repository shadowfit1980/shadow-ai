/**
 * AI Behavior Tree Service
 * 
 * Complete behavior tree implementation for game AI:
 * - Node types (Composite, Decorator, Leaf)
 * - Common behaviors (Patrol, Chase, Attack, Flee)
 * - State machine integration
 * - Code generation for multiple engines
 */

import { EventEmitter } from 'events';

export type NodeStatus = 'success' | 'failure' | 'running';
export type NodeType = 'sequence' | 'selector' | 'parallel' | 'decorator' | 'action' | 'condition';

export interface BehaviorNode {
    id: string;
    type: NodeType;
    name: string;
    children?: BehaviorNode[];
    decorator?: 'inverter' | 'repeater' | 'succeeder' | 'untilFail';
    action?: string;
    condition?: string;
}

export interface BehaviorTree {
    name: string;
    root: BehaviorNode;
}

export class AIBehaviorTreeService extends EventEmitter {
    private static instance: AIBehaviorTreeService;

    private constructor() { super(); }

    static getInstance(): AIBehaviorTreeService {
        if (!AIBehaviorTreeService.instance) {
            AIBehaviorTreeService.instance = new AIBehaviorTreeService();
        }
        return AIBehaviorTreeService.instance;
    }

    // ========================================================================
    // PRESET BEHAVIOR TREES
    // ========================================================================

    getPatrolTree(): BehaviorTree {
        return {
            name: 'Patrol Behavior',
            root: {
                id: 'root',
                type: 'selector',
                name: 'Patrol AI',
                children: [
                    {
                        id: 'chase',
                        type: 'sequence',
                        name: 'Chase Player',
                        children: [
                            { id: 'see', type: 'condition', name: 'Can See Player', condition: 'canSeePlayer()' },
                            { id: 'move', type: 'action', name: 'Move To Player', action: 'moveToPlayer()' }
                        ]
                    },
                    {
                        id: 'patrol',
                        type: 'sequence',
                        name: 'Patrol Route',
                        children: [
                            { id: 'next', type: 'action', name: 'Get Next Waypoint', action: 'getNextWaypoint()' },
                            { id: 'goto', type: 'action', name: 'Move To Waypoint', action: 'moveToWaypoint()' },
                            { id: 'wait', type: 'action', name: 'Wait', action: 'wait(2)' }
                        ]
                    }
                ]
            }
        };
    }

    getCombatTree(): BehaviorTree {
        return {
            name: 'Combat Behavior',
            root: {
                id: 'root',
                type: 'selector',
                name: 'Combat AI',
                children: [
                    {
                        id: 'flee',
                        type: 'sequence',
                        name: 'Flee When Low Health',
                        children: [
                            { id: 'low', type: 'condition', name: 'Health Low', condition: 'health < 20' },
                            { id: 'run', type: 'action', name: 'Flee', action: 'fleeFromPlayer()' }
                        ]
                    },
                    {
                        id: 'attack',
                        type: 'sequence',
                        name: 'Attack When In Range',
                        children: [
                            { id: 'range', type: 'condition', name: 'In Attack Range', condition: 'distanceToPlayer < attackRange' },
                            { id: 'atk', type: 'action', name: 'Attack', action: 'attackPlayer()' }
                        ]
                    },
                    {
                        id: 'chase',
                        type: 'sequence',
                        name: 'Chase Player',
                        children: [
                            { id: 'see', type: 'condition', name: 'Can See Player', condition: 'canSeePlayer()' },
                            { id: 'move', type: 'action', name: 'Move To Player', action: 'moveToPlayer()' }
                        ]
                    },
                    {
                        id: 'idle',
                        type: 'action',
                        name: 'Idle',
                        action: 'idle()'
                    }
                ]
            }
        };
    }

    // ========================================================================
    // CODE GENERATION
    // ========================================================================

    generateBehaviorTreeCode(tree: BehaviorTree, engine: 'unity' | 'godot' | 'custom'): string {
        switch (engine) {
            case 'unity': return this.generateUnityBT(tree);
            case 'godot': return this.generateGodotBT(tree);
            default: return this.generateCustomBT(tree);
        }
    }

    private generateUnityBT(tree: BehaviorTree): string {
        return `
// Unity Behavior Tree - ${tree.name}
using UnityEngine;

public enum NodeStatus { Success, Failure, Running }

public abstract class BTNode {
    public abstract NodeStatus Evaluate();
}

public class Selector : BTNode {
    private BTNode[] children;
    
    public Selector(params BTNode[] nodes) => children = nodes;
    
    public override NodeStatus Evaluate() {
        foreach (var child in children) {
            var status = child.Evaluate();
            if (status != NodeStatus.Failure) return status;
        }
        return NodeStatus.Failure;
    }
}

public class Sequence : BTNode {
    private BTNode[] children;
    
    public Sequence(params BTNode[] nodes) => children = nodes;
    
    public override NodeStatus Evaluate() {
        foreach (var child in children) {
            var status = child.Evaluate();
            if (status != NodeStatus.Success) return status;
        }
        return NodeStatus.Success;
    }
}

public class ActionNode : BTNode {
    private System.Func<NodeStatus> action;
    
    public ActionNode(System.Func<NodeStatus> action) => this.action = action;
    
    public override NodeStatus Evaluate() => action();
}

public class ConditionNode : BTNode {
    private System.Func<bool> condition;
    
    public ConditionNode(System.Func<bool> condition) => this.condition = condition;
    
    public override NodeStatus Evaluate() => 
        condition() ? NodeStatus.Success : NodeStatus.Failure;
}

// Usage - ${tree.name}
public class ${tree.name.replace(/\\s/g, '')}AI : MonoBehaviour {
    private BTNode behaviorTree;
    
    void Start() {
        behaviorTree = new Selector(
            new Sequence(
                new ConditionNode(() => CanSeePlayer()),
                new ActionNode(() => MoveToPlayer())
            ),
            new ActionNode(() => Patrol())
        );
    }
    
    void Update() {
        behaviorTree.Evaluate();
    }
    
    private bool CanSeePlayer() => /* implement */;
    private NodeStatus MoveToPlayer() => /* implement */;
    private NodeStatus Patrol() => /* implement */;
}`;
    }

    private generateGodotBT(tree: BehaviorTree): string {
        return `
# Godot Behavior Tree - ${tree.name}
extends Node

enum Status { SUCCESS, FAILURE, RUNNING }

class BTNode:
    func evaluate() -> int:
        return Status.FAILURE

class Selector extends BTNode:
    var children: Array = []
    
    func _init(nodes: Array):
        children = nodes
    
    func evaluate() -> int:
        for child in children:
            var status = child.evaluate()
            if status != Status.FAILURE:
                return status
        return Status.FAILURE

class Sequence extends BTNode:
    var children: Array = []
    
    func _init(nodes: Array):
        children = nodes
    
    func evaluate() -> int:
        for child in children:
            var status = child.evaluate()
            if status != Status.SUCCESS:
                return status
        return Status.SUCCESS

class ActionNode extends BTNode:
    var action: Callable
    
    func _init(action_func: Callable):
        action = action_func
    
    func evaluate() -> int:
        return action.call()

class ConditionNode extends BTNode:
    var condition: Callable
    
    func _init(condition_func: Callable):
        condition = condition_func
    
    func evaluate() -> int:
        return Status.SUCCESS if condition.call() else Status.FAILURE

# Usage
var behavior_tree: BTNode

func _ready():
    behavior_tree = Selector.new([
        Sequence.new([
            ConditionNode.new(can_see_player),
            ActionNode.new(move_to_player)
        ]),
        ActionNode.new(patrol)
    ])

func _process(_delta):
    behavior_tree.evaluate()

func can_see_player() -> bool:
    # Implement visibility check
    pass

func move_to_player() -> int:
    # Implement movement
    return Status.RUNNING

func patrol() -> int:
    # Implement patrol
    return Status.RUNNING`;
    }

    private generateCustomBT(_tree: BehaviorTree): string {
        return `
// Custom JavaScript Behavior Tree
class BTNode {
    evaluate() { return 'failure'; }
}

class Selector extends BTNode {
    constructor(...children) {
        super();
        this.children = children;
    }
    
    evaluate() {
        for (const child of this.children) {
            const status = child.evaluate();
            if (status !== 'failure') return status;
        }
        return 'failure';
    }
}

class Sequence extends BTNode {
    constructor(...children) {
        super();
        this.children = children;
    }
    
    evaluate() {
        for (const child of this.children) {
            const status = child.evaluate();
            if (status !== 'success') return status;
        }
        return 'success';
    }
}

class Action extends BTNode {
    constructor(action) {
        super();
        this.action = action;
    }
    
    evaluate() {
        return this.action();
    }
}

class Condition extends BTNode {
    constructor(condition) {
        super();
        this.condition = condition;
    }
    
    evaluate() {
        return this.condition() ? 'success' : 'failure';
    }
}

// Decorator nodes
class Inverter extends BTNode {
    constructor(child) {
        super();
        this.child = child;
    }
    
    evaluate() {
        const status = this.child.evaluate();
        if (status === 'success') return 'failure';
        if (status === 'failure') return 'success';
        return 'running';
    }
}

class Repeater extends BTNode {
    constructor(child, times = Infinity) {
        super();
        this.child = child;
        this.times = times;
        this.count = 0;
    }
    
    evaluate() {
        if (this.count < this.times) {
            const status = this.child.evaluate();
            if (status !== 'running') this.count++;
            if (this.count >= this.times) return 'success';
        }
        return 'running';
    }
}

// Usage
const tree = new Selector(
    new Sequence(
        new Condition(() => this.canSeePlayer()),
        new Action(() => this.chasePlayer())
    ),
    new Action(() => this.patrol())
);

function update() {
    tree.evaluate();
}`;
    }

    // ========================================================================
    // FSM (Finite State Machine)
    // ========================================================================

    generateFSMCode(): string {
        return `
// Finite State Machine for Game AI
class State {
    constructor(name) {
        this.name = name;
    }
    
    enter() {}
    execute(deltaTime) {}
    exit() {}
}

class StateMachine {
    constructor(owner) {
        this.owner = owner;
        this.currentState = null;
        this.previousState = null;
        this.globalState = null;
    }
    
    changeState(newState) {
        this.previousState = this.currentState;
        
        if (this.currentState) {
            this.currentState.exit();
        }
        
        this.currentState = newState;
        this.currentState.enter();
    }
    
    update(deltaTime) {
        if (this.globalState) {
            this.globalState.execute(deltaTime);
        }
        
        if (this.currentState) {
            this.currentState.execute(deltaTime);
        }
    }
    
    revertToPreviousState() {
        this.changeState(this.previousState);
    }
}

// Example States
class IdleState extends State {
    constructor(enemy) {
        super('Idle');
        this.enemy = enemy;
    }
    
    enter() {
        this.enemy.playAnimation('idle');
    }
    
    execute(deltaTime) {
        if (this.enemy.canSeePlayer()) {
            this.enemy.fsm.changeState(new ChaseState(this.enemy));
        }
    }
}

class ChaseState extends State {
    constructor(enemy) {
        super('Chase');
        this.enemy = enemy;
    }
    
    enter() {
        this.enemy.playAnimation('run');
    }
    
    execute(deltaTime) {
        if (!this.enemy.canSeePlayer()) {
            this.enemy.fsm.changeState(new IdleState(this.enemy));
            return;
        }
        
        if (this.enemy.isInAttackRange()) {
            this.enemy.fsm.changeState(new AttackState(this.enemy));
            return;
        }
        
        this.enemy.moveTowardsPlayer(deltaTime);
    }
}

class AttackState extends State {
    constructor(enemy) {
        super('Attack');
        this.enemy = enemy;
        this.attackCooldown = 0;
    }
    
    enter() {
        this.enemy.playAnimation('attack');
    }
    
    execute(deltaTime) {
        this.attackCooldown -= deltaTime;
        
        if (!this.enemy.isInAttackRange()) {
            this.enemy.fsm.changeState(new ChaseState(this.enemy));
            return;
        }
        
        if (this.attackCooldown <= 0) {
            this.enemy.attack();
            this.attackCooldown = 1.0; // 1 second cooldown
        }
    }
}

// Usage
class Enemy {
    constructor() {
        this.fsm = new StateMachine(this);
        this.fsm.changeState(new IdleState(this));
    }
    
    update(deltaTime) {
        this.fsm.update(deltaTime);
    }
}`;
    }
}

export const aiBehaviorTreeService = AIBehaviorTreeService.getInstance();

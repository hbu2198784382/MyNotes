# 核心思想
Dijkstra 算法利用了与 [[Bellman-Ford 算法]] 相同的[[Bellman-Ford 算法#松弛操作|松弛操作]]。同时，针对**非负权图**，使用了[[贪心算法]]进行了化简。
## 贪心策略
每次都从**未确定最短路的点**中，选取当前 $dist$ 最小的点 $u$ ，可以证明其最短路已经确定，用 $u$ 去松弛它的后继节点。

### 贪心证明
证明：**对于当前 $dist$ 最小的点 $u$ ，其最短路径已经确定。**
假设已经确定最短路径的节点集合为 $S$ 。
1. 边界条件：初始时 $S=\{ s \}$ ，由于 $dis[s]=0$ ，而其余节点 $dis[v]=\infty$ ，最小节点 $s$ 最短路必然确定。
2. 递推归纳：若 $u \in V \setminus S$ ，假设存在一条从 $s$ 到 $u$ 的路径 $P$ ，且长度小于 $dis[u]$ 。
由 $s \in S$ ，则路径 $P$ 上必然存在一条边 $(a,b)$ ，使得：$a \in S$ 且 $b \in S$ ，同时 $b$ 是路径 $P$ 上第一个不属于 $S$ 的节点。由于 $a \in S$ ，则 $dis[a]$ 是 $s$ 到 $a$ 的最短距离。由于算法已经给 $a$ 进行过一次松弛操作，那么必有：$$dis[b] \leq dis[a] + w(a,b)$$ 假设在路径 $P$ 上从 $s$ 到 $v$ 点的距离为 $d(v)$ 。那么，由于已经确定 $dis[a]$ 是最短距离，故 $d(a) \geq dis[a]$ 。那么 $d(b) = d(a) + w(a,b) \geq dis[a] + w(a,b) \geq dis[b]$
**由于所有边权非负**，经过路径 $P$ 从 $b$ 到 $u$ 的一段不会减少总长度。那么有 $d(u)\geq d(b)$ 恒成立。由于 $u$ 是 $dis$ 最小的节点，故 $dis[u]\leq dis[b]$ ，综上有 $d(u)\geq dis[u]$ 。与假设矛盾，推出 $dis[u]$ 就是最短距离。

### 堆优化
由于 dijkstra 算法需要频繁获取最小值，故使用[[二叉堆#最小堆|最小堆]]存储过程中的数据，实现过程的加速。

## 算法步骤
1. 初始化 $dis[s]=0;dis[v]=\infty(v\neq s)$ ；将 $(s,0)$ 入最小堆。
2. 取出堆根 $(u,d)$ ，若 $d>dis[u]$，说明此数据已过期，跳过此数据 。
3. 遍历 $u$ 的所有后继 $(v,w)$ ，若 $dis[u] + w < dis[v]$：
	- 更新 $dis[v]=dis[u]+w$
	- $(v,dis[v])$ 压入堆
4. 回到 $2.$ ，直到堆空。

# 实现代码

```cpp
int heapidx[MAXN],heapd[MAXN],dis[MAXN],hend=-1; // heaps
int head[MAXN],to[MAXM],nxt[MAXM],w[MAXM]; // graph
memset(heapidx,-1,sizeof(int)*MAXN);memset(heapd,-1,sizeof(int)*MAXN);
for(int i = 0;i < MAXN;i++) dis[i] = INF;
memset(head,-1,sizeof(int)*MAXN);memset(to,-1,sizeof(int)*MAXM);
memset(nxt,-1,sizeof(int)*MAXM);memset(w,0,sizeof(int)*MAXM);

... // build graph

void push(int v,int d){
	heapidx[++hend]=v;heapd[hend]=d;int i = hend,temp;
	// swim
	while(i > 0 && heapd[(i-1)/2] > heapd[i]){
		temp=heapidx[(i-1)/2];heapidx[(i-1)/2]=heapidx[i];heapidx[i]=temp;
		temp=heapd[(i-1)/2];heapd[(i-1)/2]=heapd[i];heapd[i]=temp;
		i = (i-1)/2;}
}
void pop(){
	heapidx[0] = heapidx[hend];heapd[0] = heapd[hend--];
	// sink
	int s = -1,i = 0,temp;
	while(1){
		s = i;if(2*i+1 <= hend && heapd[s] > heapd[2*i+1]) s = 2*i+1;
		if(2*i+2 <= hend && heapd[s] > heapd[2*i+2]) s = 2*i+2;
		if(s==i) break;
		temp=heapd[s];heapd[s]=heapd[i];heapd[i]=temp;
		temp=heapidx[s];heapidx[s]=heapidx[i];heapidx[i]=temp;
		i = s;
	}
}

int dijkstra(int s,int t){
	dis[s] = 0;push(s,0);
	int u,d;
	while(hend>=0){
		u = heapidx[0]; d = heapd[0];pop();
		if(d>dis[u]) continue;
		for(int e=head[u];e!=-1;e=nxt[e]) if(dis[u] + w[e] < dis[to[e]]){
			dis[to[e]] = dis[u] + w[e];push(to[e],dis[to[e]]);
	}}
	return(dis[t]);
	}
```

算法时间复杂度 ：$O((n+m)\log n)$
空间复杂度：$O(n+m)$


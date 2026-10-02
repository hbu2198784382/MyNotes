# 核心思想
## 松弛操作
Bellman-Ford 算法的核心在于**松弛操作**：假设 $dis(v)$ 表示从原点 $s$ 出发到 $v$ 的最短距离， $$dis(v)=min_{u\in N}(dis(u)+w(u,v))$$ 其中 $N$ 表示其所有前驱节点的集合。
特别地，$dis(s)=0$。对于不可达节点，$dis(v)=+\infty$。
那么就可以提出**松弛操作**：
> 若 dis\[u] + w(u,v) < dis\[v]
> 则 dis\[v] = dis\[u] + w(u,v)

## 算法设计
Bellman-Ford 使用反复遍历所有边，将所有边依次进行松弛操作的方法，找出最短路径。那么，在第一轮对所有边松弛时，发现 $s$ 所有的后继节点一定找到最短路径，第二次松弛时，发现上一轮已经找到最短路径的节点的后继可以找到最短路径。因此，循环轮数的上界就是图的最长路径边数。假设有 $n$ 个节点，那么图的最长路径的边数不可能超过 $n-1$ 。那么得到结论：**只需要循环 $n-1$ 伦，一定能够找到所有节点的最短路径**。

## 实现代码
因为要遍历边，而且要多次获取前驱节点，故考虑采用直接[[图的存储#存边|直接存边]]的方式存储图
```cpp
int from[M],to[M],w[M];
... //build the graph
int dis[N] = {INF};dis[s] = 0;

bool update = false;
for(int i = 0;i < n-1 && !update;i++){
	update = false;
	for(int e = 0;e < M;e++)if(dist[from[e]]!=INF){
		dist[to[e]] = (dist[to[e]]<dist[from[e]]+w[e])?dist[to[e]]:dist[from[e]]+w[e];
		update = true;}
}
```

时间复杂度 $O(mn)$ ，空间复杂度 $O(m)$ 。
# 检测负环
根据上面的论证，只需要 $n-1$ 轮松弛操作就可以了。若存在第 $n$ 轮松弛操作，且结果发生变化，说明图存在负环。

# SPFA 优化
SPFA 优化即使用队列对 Bellman-Ford 算法进行优化。
## 思路分析
Bellman-Ford 算法存在一个冗余的步骤：**每一轮都对所有边进行了松弛操作。** 事实上，只需要对**前驱节点刚刚更新过的节点**进行更新就可以了。因此使用队列存储每次更新节点：
1. 原点入队
2. 队首 $u$ 出队
3. 松弛 $u$  的所有后继 $v$ 。如果 $v$ 的距离被更新且不在队列中，就将 $v$ 入队。
4. 回到 $2.$ ，直到队列为空。

## 实现代码
SPFA 由于要访问一个节点的所有后继节点，故使用[[图的存储#链式前向星|链式前向星]]存储：
```cpp
int head[N],to[M],nxt[M],w[M];
... // build the graph

int dis[N] = {INF};dis[s] = 0;
queue<int> q;
bool inqueue[N] = {false};
inqueue[s] = true;q.push(s);
int u;

while(!q.empty()){
	u = q.front();q.pop();inqueue[u] = false;
	for(int e = head[u];e != -1;e = nxt[e]){
		if(dis[to[e]] > dis[u] + w[e]){
			dis[to[e]]=dis[u]+w[e];
			if(!inqueue[to[e]]){
				q.push(to[e]);inqueue[to[e]]=true;
			}}}}
```

平均时间复杂度 $O(km)$ ，其中 $k$ 是每个节点的平均入队次数，可以证明 $k\leq n$ 恒成立。最坏情况下退化为 Bellman-Ford 算法的 $O(nm)$ 。空间复杂度 $O(V+E)$ 。

> [!NOTE] 补充证明
> 证明：**对于不存在负环的图，每个节点的入队次数一定不超过 $n-1$**
> 由上述论证得，完成 Bellman-Ford 算法总计需要的松弛操作轮数不超过 $n-1$ 。由于每一轮都会遍历所有可达节点，那么每个节点的更新次数也一定不超过 $n-1$ 。

基于此性质，可以利用计数判断是否存在负环：**若存在某个节点的入队次数大于 $n-1$ ，则必然存在负环**。
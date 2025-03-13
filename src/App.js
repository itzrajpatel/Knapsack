import React, { useState } from "react";
import {
  Card,
  CardContent,
  Button,
  Typography,
  TextField,
  Grid,
} from "@mui/material";
import { motion } from "framer-motion";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Tree from "react-d3-tree"; // Tree visualization library
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import "@fontsource/alegreya-sc"; // This imports Alegreya SC in your project

const theme = createTheme({
  palette: {
    primary: { main: "#2e86c1" },
    secondary: { main: "#17202a" },
  },
});

const KnapsackSolver = () => {
  const [items, setItems] = useState([]);
  const [capacity, setCapacity] = useState("");
  const [newWeight, setNewWeight] = useState("");
  const [newValue, setNewValue] = useState("");
  const [result, setResult] = useState(null);
  const [treeData, setTreeData] = useState(null);

  const [solutionSteps, setSolutionSteps] = useState([]);

  // Dynamic Programming Solution
  // const knapsackDP = (items, capacity) => {
  //   const n = items.length;
  //   const dp = Array(n + 1).fill(0).map(() => Array(capacity + 1).fill(0));

  //   for (let i = 1; i <= n; i++) {
  //     for (let w = 1; w <= capacity; w++) {
  //       if (items[i - 1].weight <= w) {
  //         dp[i][w] = Math.max(items[i - 1].value + dp[i - 1][w - items[i - 1].weight], dp[i - 1][w]);
  //       } else {
  //         dp[i][w] = dp[i - 1][w];
  //       }
  //     }
  //   }
  //   return dp[n][capacity];
  // };
  const knapsackDP = (items, capacity) => {
    const n = items.length;
    const dp = Array(n + 1).fill(0).map(() => Array(capacity + 1).fill(0));
    let steps = [];
  
    for (let i = 1; i <= n; i++) {
      for (let w = 1; w <= capacity; w++) {
        if (items[i - 1].weight <= w) {
          dp[i][w] = Math.max(items[i - 1].value + dp[i - 1][w - items[i - 1].weight], dp[i - 1][w]);
          steps.push(`Item ${i} (W=${items[i-1].weight}, V=${items[i-1].value}) fits in capacity ${w}. ` +
                     `Max Value updated: dp[${i}][${w}] = ${dp[i][w]}`);
        } else {
          dp[i][w] = dp[i - 1][w];
          steps.push(`Item ${i} (W=${items[i-1].weight}, V=${items[i-1].value}) cannot fit in capacity ${w}. ` +
                     `Value remains same: dp[${i}][${w}] = ${dp[i][w]}`);
        }
      }
    }
    
    return { result: dp[n][capacity], steps };
  };    

  // Backtracking Solution
  // const knapsackBT = (items, capacity, index = 0, currentWeight = 0, currentValue = 0) => {
  //   if (index === items.length) return currentValue;

  //   let exclude = knapsackBT(items, capacity, index + 1, currentWeight, currentValue);
  //   let include = 0;
  //   if (currentWeight + items[index].weight <= capacity) {
  //     include = knapsackBT(
  //       items,
  //       capacity,
  //       index + 1,
  //       currentWeight + items[index].weight,
  //       currentValue + items[index].value
  //     );
  //   }
  //   return Math.max(include, exclude);
  // };
  const knapsackBT = (items, capacity, index = 0, currentWeight = 0, currentValue = 0, steps = []) => {
    if (index === items.length) {
      steps.push(`Reached end of items. Current value = ${currentValue}`);
      return { result: currentValue, steps };
    }
  
    steps.push(`Considering Item ${index + 1} (W=${items[index].weight}, V=${items[index].value})`);
  
    let exclude = knapsackBT(items, capacity, index + 1, currentWeight, currentValue, steps);
    let include = { result: 0, steps: [] };
  
    if (currentWeight + items[index].weight <= capacity) {
      include = knapsackBT(
        items, capacity, index + 1,
        currentWeight + items[index].weight,
        currentValue + items[index].value, steps
      );
    }
  
    let best = Math.max(include.result, exclude.result);
    steps.push(`Best value at index ${index} is ${best}`);
    
    return { result: best, steps };
  };
    

  // Branch and Bound Solution
  // const knapsackBB = (items, capacity) => {
  //   items.sort((a, b) => b.value / b.weight - a.value / a.weight);
  //   let maxValue = 0;
  //   const queue = [{ index: 0, weight: 0, value: 0 }];

  //   while (queue.length) {
  //     let { index, weight, value } = queue.shift();
  //     if (index >= items.length) continue;
  //     if (weight + items[index].weight <= capacity) {
  //       let newWeight = weight + items[index].weight;
  //       let newValue = value + items[index].value;
  //       maxValue = Math.max(maxValue, newValue);
  //       queue.push({ index: index + 1, weight: newWeight, value: newValue });
  //     }
  //     queue.push({ index: index + 1, weight, value });
  //   }
  //   return maxValue;
  // };
  const knapsackBB = (items, capacity) => {
    items.sort((a, b) => b.value / b.weight - a.value / a.weight);
    let maxValue = 0;
    let queue = [{ index: 0, weight: 0, value: 0 }];
    let steps = [];
  
    while (queue.length) {
      let { index, weight, value } = queue.shift();
      steps.push(`Processing index ${index}, weight ${weight}, value ${value}`);
  
      if (index >= items.length) continue;
  
      if (weight + items[index].weight <= capacity) {
        let newWeight = weight + items[index].weight;
        let newValue = value + items[index].value;
        maxValue = Math.max(maxValue, newValue);
        steps.push(`Item ${index + 1} included. New weight: ${newWeight}, New value: ${newValue}`);
        queue.push({ index: index + 1, weight: newWeight, value: newValue });
      }
  
      queue.push({ index: index + 1, weight, value });
    }
  
    return { result: maxValue, steps };
  };
    

  // Generate tree for Dynamic Programming
  const generateDPTree = (items, capacity) => {
    const n = items.length;
    const dp = Array(n + 1).fill(0).map(() => Array(capacity + 1).fill(0));
    let treeRoot = { name: "Start", children: [] };
  
    for (let i = 1; i <= n; i++) {
      let level = { name: `Item ${i}`, children: [] };
      for (let w = 1; w <= capacity; w++) {
        if (items[i - 1].weight <= w) {
          dp[i][w] = Math.max(items[i - 1].value + dp[i - 1][w - items[i - 1].weight], dp[i - 1][w]);
        } else {
          dp[i][w] = dp[i - 1][w];
        }
        level.children.push({
          name: `W: ${w}, V: ${dp[i][w]}`,
          highlight: i === n && w === capacity, // Mark final result node
        });
      }
      treeRoot.children.push(level);
    }
    return treeRoot;
  };  

  // Generate tree for Back Tracking
  const generateBTTree = (items, capacity) => {
    let treeRoot = { name: "Start", children: [] };
    let bestNode = { value: 0, path: [] }; // Track the best node
  
    const backtrack = (i, remainingCapacity, value, path) => {
      if (i === items.length || remainingCapacity <= 0) {
        if (value > bestNode.value) {
          bestNode = { value, path };
        }
        return { name: `Val: ${value}`, value, highlight: false };
      }
  
      let node = { name: `Item ${i}`, children: [] };
  
      if (items[i].weight <= remainingCapacity) {
        node.children.push(
          backtrack(i + 1, remainingCapacity - items[i].weight, value + items[i].value, [...path, i])
        );
      }
  
      node.children.push(backtrack(i + 1, remainingCapacity, value, path));
      return node;
    };
  
    // Generate the tree
    treeRoot.children.push(backtrack(0, capacity, 0, []));
  
    // Traverse tree to highlight the best node
    const highlightBestNode = (node) => {
      if (node.value === bestNode.value) {
        node.highlight = true;
      }
      if (node.children) {
        node.children.forEach(highlightBestNode);
      }
    };
  
    highlightBestNode(treeRoot);
  
    return treeRoot;
  };    
  
  // Generate tree for Branch and Bound
  const generateBBTree = (items, capacity) => {
    let treeRoot = { name: "Start", children: [] };
    let bestLeafNode = { value: 0, path: [] }; // Track the best leaf node
  
    let queue = [{ 
      level: 0, 
      remainingCapacity: capacity, 
      value: 0, 
      path: [], 
      parent: treeRoot 
    }];
  
    while (queue.length) {
      let node = queue.shift();
  
      let currentNode = { 
        name: `L${node.level}, V:${node.value}`, 
        value: node.value, 
        children: [] 
      };
  
      node.parent.children.push(currentNode);
  
      // If it's a leaf node, check if it's the best one
      if (node.level === items.length || node.remainingCapacity <= 0) {
        if (node.value > bestLeafNode.value) {
          bestLeafNode = { value: node.value, path: node.path };
        }
        continue; // Skip further expansion
      }
  
      // Include the item if it fits
      if (items[node.level].weight <= node.remainingCapacity) {
        queue.push({
          level: node.level + 1,
          remainingCapacity: node.remainingCapacity - items[node.level].weight,
          value: node.value + items[node.level].value,
          path: [...node.path, node.level],
          parent: currentNode,
        });
      }
  
      // Exclude the item
      queue.push({
        level: node.level + 1,
        remainingCapacity: node.remainingCapacity,
        value: node.value,
        path: node.path,
        parent: currentNode,
      });
    }
  
    // Highlight the best leaf node
    const highlightBestLeafNode = (node) => {
      if (node.children.length === 0 && node.value === bestLeafNode.value) {
        node.highlight = true; // Highlight only the best leaf node
      }
      if (node.children) {
        node.children.forEach(highlightBestLeafNode);
      }
    };
  
    highlightBestLeafNode(treeRoot);
  
    return treeRoot;
  };    

  // const handleSolve = (method) => {
  //   if (!capacity || items.length === 0) return;

  //   let finalResult = 0;
  //   let tree = null;

  //   if (method === "Dynamic Programming") {
  //     finalResult = knapsackDP(items, capacity);
  //     tree = generateDPTree(items, capacity);
  //   } else if (method === "Back Tracking") {
  //     finalResult = knapsackBT(items, capacity);
  //     tree = generateBTTree(items, capacity); // For now, use DP's tree (Backtracking tree can be added)
  //   } else if (method === "Branch & Bound") {
  //     finalResult = knapsackBB(items, capacity);
  //     tree = generateBBTree(items, capacity); // For now, use DP's tree (BB tree can be added)
  //   }

  //   setResult({ method, finalResult });
  //   setTimeout(() => setTreeData(tree), 1000); // Show tree after 1 sec delay
  // };
  const handleSolve = (method) => {
    if (!capacity || items.length === 0) return;
  
    let finalResult = 0;
    let tree = null;
    let steps = [];
  
    if (method === "Dynamic Programming") {
      const resultData = knapsackDP(items, capacity);
      finalResult = resultData.result;
      steps = resultData.steps;
      tree = generateDPTree(items, capacity);
    } else if (method === "Back Tracking") {
      const resultData = knapsackBT(items, capacity);
      finalResult = resultData.result;
      steps = resultData.steps;
      tree = generateBTTree(items, capacity);
    } else if (method === "Branch & Bound") {
      const resultData = knapsackBB(items, capacity);
      finalResult = resultData.result;
      steps = resultData.steps;
      tree = generateBBTree(items, capacity);
    }
  
    setSolutionSteps(steps);
    setResult({ method, finalResult });
    setTimeout(() => setTreeData(tree), 1000);
  };

  const handleAddItem = () => {
    if (newWeight && newValue && newWeight > 0 && newValue > 0) {
      setItems([...items, { weight: parseInt(newWeight), value: parseInt(newValue) }]);
      setNewWeight("");
      setNewValue("");
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          backgroundImage: `url("/assets/cardBlue.svg")`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: "800px", width: "100%", padding: "50px 20px 0 20px" }}>
          <Typography 
            variant="h4" 
            gutterBottom 
            style={{ textAlign: "center", color: "white", fontFamily: "'Alegreya SC', serif" }}
          >
            Knapsack Problem Solver with Tree Visualization
          </Typography>

          {/* Card with Background Image */}
          <Card
            raised
            component={motion.div}
            whileHover={{ scale: 1.02 }}
            style={{
              marginTop: "50px",
              borderRadius: "20px",
              backgroundImage: `url("/assets/cardRed2.jpg")`,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          >
            <CardContent>
              <Typography variant="h6" style={{ marginBottom: "10px", textAlign: "center" }}>
                Enter Capacity
              </Typography>
              <Grid container spacing={2} justifyContent="center">
                <Grid item>
                  <TextField
                    label="Capacity"
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value))}
                  />
                </Grid>
              </Grid>

              <Typography variant="h6" style={{ marginTop: "30px", marginBottom: "10px", textAlign: "center" }}>
                Add Item
              </Typography>
              <Grid container spacing={2} justifyContent="center">
                <Grid item>
                  <TextField label="Weight" type="number" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} />
                </Grid>
                <Grid item>
                  <TextField label="Value" type="number" value={newValue} onChange={(e) => setNewValue(e.target.value)} />
                </Grid>
                <Grid item>
                  <Button variant="contained" color="secondary" onClick={handleAddItem} style={{ marginTop: "10px" }}>
                    Add Item
                  </Button>
                </Grid>
              </Grid>

              {/* Table */}
              {items.length > 0 && (
                <TableContainer component={Paper} style={{ marginTop: "20px", borderRadius: "20px",
                  backgroundImage: `url("/assets/cardCyan.svg")`,
                  backgroundSize: "cover",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center", }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Item No.</strong></TableCell>
                        <TableCell><strong>Weight</strong></TableCell>
                        <TableCell><strong>Value</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{item.weight}</TableCell>
                          <TableCell>{item.value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Method Buttons */}
              <Grid container spacing={2} justifyContent="center" style={{ marginTop: "15px" }}>
                <Grid item>
                  <Button variant="contained" color="primary" onClick={() => handleSolve("Dynamic Programming")}>
                    Dynamic Programming
                  </Button>
                </Grid>
                <Grid item>
                  <Button variant="contained" color="primary" onClick={() => handleSolve("Back Tracking")}>
                    Back Tracking
                  </Button>
                </Grid>
                <Grid item>
                  <Button variant="contained" color="primary" onClick={() => handleSolve("Branch & Bound")}>
                    Branch and Bound
                  </Button>
                </Grid>
              </Grid>

              {solutionSteps.length > 0 && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    style={{
      marginTop: "20px",
      padding: "15px",
      background: "linear-gradient(135deg, #ffecb3, #ffcc80)", // Light Orange Gradient
      borderRadius: "15px",
      boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)", // Soft shadow effect
    }}
  >
    <Typography
      variant="h5"
      style={{
        textAlign: "center",
        color: "#8d6e63", // Dark brown
        fontWeight: "bold",
        fontFamily: "Alegreya SC, serif",
      }}
    >
      Step-by-Step Solution ({result.method})
    </Typography>
    
    <div
      style={{
        maxHeight: "250px",
        overflowY: "auto",
        padding: "10px",
        background: "#ffffff",
        borderRadius: "10px",
        marginTop: "10px",
        border: "1px solid #ffab91",
      }}
    >
      <ul style={{ paddingLeft: "20px", listStyleType: "none" }}>
        {solutionSteps.map((step, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }} // Staggered animation effect
            style={{
              marginBottom: "10px",
              padding: "10px",
              fontSize: "14px",
              borderRadius: "8px",
              background: index % 2 === 0 ? "#ffe0b2" : "#ffcc80", // Alternating colors
              fontWeight: "500",
              color: "#6d4c41", // Dark brown text
            }}
          >
            <strong>Step {index + 1}:</strong> {step}
          </motion.li>
        ))}
      </ul>
    </div>
  </motion.div>
)}
              
              {result && (
                <Typography variant="h6" style={{ marginTop: "15px", color: "white", textAlign: "center" }}>
                  {result.method} Result: {result.finalResult}
                </Typography>
              )}

              {treeData && (
                <div style={{ width: "100%", height: "400px", marginTop: "20px", border: "1px solid #ddd" }}>
                  <Tree
                    data={treeData}
                    orientation="vertical"
                    translate={{ x: 200, y: 50 }}
                    nodeSize={{ x: 100, y: 100 }}
                    separation={{ siblings: 1, nonSiblings: 2 }}
                    renderCustomNodeElement={({ nodeDatum }) => (
                      <g>
                        <circle
                          r={20}
                          fill={nodeDatum.highlight ? "#f7dc6f" : "#4CAF50"} // Highlight final result node
                          stroke="black"
                          strokeWidth="2"
                        />
                        <text
                          x={0}
                          y={30}
                          textAnchor="middle"
                          fill="black"
                          fontSize="12px"
                          fontWeight="bold"
                        >
                          {nodeDatum.name}
                        </text>
                      </g>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default KnapsackSolver;

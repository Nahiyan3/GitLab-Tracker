@main def main() = {
  importCpg("tracker.cpg")
  
  println("==================================================")
  println("JOERN ANALYSIS: GITLAB-TRACKER")
  println("==================================================")
  
  println("\n[1] Top 10 Methods with the most control structures (Complexity Proxy):")
  cpg.method.filter(_.isExternal == false).sortBy(_.controlStructure.size).reverse.take(10).map(m => s"- ${m.fullName} (Control Structures: ${m.controlStructure.size})").foreach(println)

  println("\n[2] Functions taking the most parameters:")
  cpg.method.filter(_.isExternal == false).sortBy(_.parameter.size).reverse.take(5).map(m => s"- ${m.fullName} (Params: ${m.parameter.size})").foreach(println)
  
  println("\n[3] Potential Hardcoded Secrets / Tokens:")
  cpg.literal.code(".*(?i)(password|secret|token|api_key).*").filterNot(_.code.contains("$")).take(10).map(l => s"- Found: ${l.code} in function ${l.method.name.headOption.getOrElse("Unknown")}").foreach(println)

  println("==================================================")
}
